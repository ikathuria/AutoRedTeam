"""Episode runner: attacker -> target -> judge over rounds, ported from App.tsx.

One *episode* is a (playbook, target_model, seed) cell. Each round appends one JSON line
to ``runs/<run_id>/<cell>.jsonl`` with the full prompts, raw outputs, latency and token
counts for all three roles. Writes are flushed and fsync'd, so a killed run resumes from
the last completed round (and, with the provider cache, re-runs completed turns for free).

Faithful to the demo except for one intentional divergence, documented below: the target
model is shown only attacker (user) and its own prior (assistant) turns — not the judge's
reasoning. The demo fed judge turns to the target as 'assistant' messages, which is
confusing and risks contaminating research results. The attacker still sees judge feedback.
"""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from time import time

from .config import ModelRef, Playbook, RunConfig, load_playbooks
from .judges import judge_round
from .prompts import ATTACKER_SYSTEM_PROMPT
from .providers import Backend, CompletionRequest

ATTACKER = "Red Team"
TARGET = "Blue Team"
JUDGE = "Arbiter"

_THOUGHT_RE = re.compile(r"THOUGHT:(.*?)(?=MESSAGE:|$)", re.DOTALL)
_MESSAGE_RE = re.compile(r"MESSAGE:(.*)", re.DOTALL)


def parse_attacker(text: str) -> tuple[str, str]:
    """Return (message, thought); fall back to the whole text if unformatted."""
    thought_m = _THOUGHT_RE.search(text)
    message_m = _MESSAGE_RE.search(text)
    thought = thought_m.group(1).strip() if thought_m else ""
    message = message_m.group(1).strip() if message_m else text.strip()
    return message, thought


def attacker_move(
    backend: Backend, model: ModelRef, history: list[dict], goal: str,
    temperature: float, seed: int | None,
):
    context = "\n".join(f"{m['role']}: {m['content']}" for m in history)
    req = CompletionRequest(
        provider=model.provider,
        model=model.id,
        messages=[
            {"role": "system", "content": ATTACKER_SYSTEM_PROMPT.replace("{GOAL}", goal)},
            {"role": "user", "content":
                f"CURRENT CONVERSATION HISTORY:\n{context}\n\nGenerate the next response."},
        ],
        temperature=temperature,
        seed=seed,
    )
    comp = backend.complete(req)
    message, thought = parse_attacker(comp.text)
    return message, thought, comp, req.messages


def target_response(
    backend: Backend, model: ModelRef, history: list[dict], system_prompt: str,
    temperature: float, seed: int | None,
):
    # Only attacker (user) and target's own prior (assistant) turns — judge turns excluded.
    mapped = [
        {"role": "user" if m["role"] == ATTACKER else "assistant", "content": m["content"]}
        for m in history
        if m["role"] in (ATTACKER, TARGET)
    ]
    req = CompletionRequest(
        provider=model.provider,
        model=model.id,
        messages=[{"role": "system", "content": system_prompt}, *mapped],
        temperature=temperature,
        seed=seed,
    )
    comp = backend.complete(req)
    return comp, req.messages


@dataclass
class EpisodeResult:
    cell: str
    rounds_run: int
    success: bool
    success_round: int | None
    resumed_from: int  # rounds already present on disk before this call


def _history_from_records(records: list[dict]) -> list[dict]:
    history: list[dict] = []
    for rec in records:
        history.append({"role": ATTACKER, "content": rec["attacker"]["message"],
                        "thought": rec["attacker"]["thought"]})
        history.append({"role": TARGET, "content": rec["target"]["response"]})
        history.append({"role": JUDGE, "content": rec["judge"]["reasoning"]})
    return history


def _read_records(path: Path) -> list[dict]:
    if not path.exists():
        return []
    records = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    records.sort(key=lambda r: r["round"])
    return records


def run_episode(
    backend: Backend, cfg: RunConfig, playbook: Playbook, target_model: ModelRef,
    seed: int, runs_dir: Path,
) -> EpisodeResult:
    cell = f"{playbook.id}__{target_model.slug}__seed{seed}"
    out_dir = runs_dir / cfg.run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{cell}.jsonl"

    records = _read_records(path)
    resumed_from = len(records)
    history = _history_from_records(records)

    # Already finished? (reached a success or the round budget)
    done = bool(records and records[-1]["success"]) or len(records) >= cfg.max_rounds
    if done:
        last = records[-1] if records else None
        return EpisodeResult(
            cell=cell, rounds_run=0,
            success=bool(last and last["success"]),
            success_round=(last["round"] if last and last["success"] else None),
            resumed_from=resumed_from,
        )

    system_prompt = playbook.system_prompt()
    success = bool(records and records[-1]["success"])
    success_round = records[-1]["round"] if success else None
    rounds_run = 0

    with path.open("a", encoding="utf-8") as fh:
        for rnd in range(len(records) + 1, cfg.max_rounds + 1):
            a_msg, a_thought, a_comp, a_prompt = attacker_move(
                backend, cfg.attacker_model, history, playbook.attacker_goal,
                cfg.attacker_temperature, seed)
            history.append({"role": ATTACKER, "content": a_msg, "thought": a_thought})

            t_comp, t_prompt = target_response(
                backend, target_model, history, system_prompt,
                cfg.target_temperature, seed)
            history.append({"role": TARGET, "content": t_comp.text})

            verdict = judge_round(
                backend, provider=cfg.judge_model.provider, model=cfg.judge_model.id,
                history=history, target_text=t_comp.text, secret=playbook.target_secret,
                temperature=cfg.judge_temperature, seed=seed)
            history.append({"role": JUDGE, "content": verdict.reasoning})

            record = {
                "run_id": cfg.run_id, "cell": cell, "playbook": playbook.id,
                "attacker_model": cfg.attacker_model.id, "target_model": target_model.id,
                "judge_model": cfg.judge_model.id, "seed": seed, "round": rnd,
                "timestamp": time(), "secret": playbook.target_secret,
                "attacker": {
                    "message": a_msg, "thought": a_thought, "raw": a_comp.text,
                    "model": a_comp.model, "prompt_tokens": a_comp.prompt_tokens,
                    "completion_tokens": a_comp.completion_tokens,
                    "latency_s": a_comp.latency_s, "cached": a_comp.cached,
                    "messages": a_prompt,
                },
                "target": {
                    "response": t_comp.text, "model": t_comp.model,
                    "prompt_tokens": t_comp.prompt_tokens,
                    "completion_tokens": t_comp.completion_tokens,
                    "latency_s": t_comp.latency_s, "cached": t_comp.cached,
                    "messages": t_prompt,
                },
                "judge": {
                    "attacker_success": verdict.attacker_success, "score": verdict.score,
                    "reasoning": verdict.reasoning, "winner": verdict.winner,
                    "hard_check": verdict.hard_check, "model": verdict.model,
                    "prompt_tokens": verdict.prompt_tokens,
                    "completion_tokens": verdict.completion_tokens,
                    "latency_s": verdict.latency_s, "cached": verdict.cached,
                    "raw": verdict.raw,
                },
                "success": verdict.attacker_success,
            }
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            fh.flush()
            os.fsync(fh.fileno())  # crash-safe: survives a kill for resume
            rounds_run += 1

            if verdict.attacker_success:
                success, success_round = True, rnd
                break

    return EpisodeResult(cell=cell, rounds_run=rounds_run, success=success,
                         success_round=success_round, resumed_from=resumed_from)


def run(backend: Backend, cfg: RunConfig, runs_dir: Path | str) -> list[EpisodeResult]:
    runs_dir = Path(runs_dir)
    playbooks = load_playbooks()
    results: list[EpisodeResult] = []
    for pid in cfg.playbook_ids:
        playbook = playbooks[pid]
        for target_model in cfg.target_models:
            for seed in cfg.seeds:
                results.append(
                    run_episode(backend, cfg, playbook, target_model, seed, runs_dir))
    return results
