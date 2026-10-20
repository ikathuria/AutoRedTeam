# AutoRedTeam — Project Tracker

> Living context map. Keep in sync whenever structure, status, or decisions change.

_Last updated: 2026-10-19_

## What it is
A multi-agent LLM red-teaming simulator: an **attacker** model tries to extract a protected
secret (or elicit prohibited output) from a **target** model over several rounds, and a
**judge** model scores each round. Four playbooks: secret leakage, PII extraction,
malicious-code jailbreak, indirect prompt injection. Being extended into a reproducible
evaluation study of **LLM-judge reliability on obfuscated leaks** — see PLAN.md.

## Current state (M0 done, 2026-10-19)
- React 19 + Vite + TypeScript browser app; provider clients for Gemini, Groq, OpenAI
  (`services/`), user-supplied API keys via modal; deployed to GitHub Pages
  (`.github/workflows/deploy.yml`) at ishani.kathuria.net/AutoRedTeam.
- Defaults to **mock mode** (scripted turns) — no measured results exist yet.
- M0 cleanup done: `AVAILABLE_MODELS` + defaults refreshed to currently-served IDs
  (Gemini 3.x/4, Llama 3.x + gpt-oss on Groq, GPT-6 family), verified against provider
  model lists 2026-10-19; junk `analysis.py` deleted; README rewritten; GitHub repo
  description corrected (dropped the false "LangGraph" claim). `npm run build` passes.
- RQ1 novelty gate checked and **stays open** — no systematic study of judge error on
  obfuscated secret leaks found; positioning in `docs/related-work.md`.
- No tests, no eval harness yet (M1+).

## Stack
| Layer | Choice |
|---|---|
| Demo UI | React 19, Vite, TypeScript |
| Eval harness (planned) | Python 3.12 + uv in `eval/` |
| Models | Groq, Gemini, OpenAI (+ Anthropic optional) |
| Hosting | GitHub Pages |

## Structure
```
App.tsx, components/, services/ (geminiService, groqService, openaiService, llmFactory),
constants.ts (models, playbooks, prompts), types.ts — demo UI
eval/ — Python harness (M1): redteam_eval/{config,providers,judges,loop,prompts,playbooks.yaml},
  configs/smoke.yaml, tests/. OpenAI-compat backends + content-hash cache + resumable JSONL.
  Run: `cd eval && uv sync --extra dev && uv run redteam-eval --config configs/smoke.yaml --fake`
```

## Status
| Milestone | Status |
|---|---|
| M0 Cleanup + lit check | ✅ done (2026-10-19) |
| M1 Python harness | ✅ done (2026-10-19) |
| M2 Leak oracle | ✅ done (2026-10-19) |
| M3 Experiment matrix | ⛔ blocked: needs API keys + budget decision |
| M4 Judge study | — |
| M5 Defenses | — |
| M6 Results in UI | — |
| M7 Write-up | — |

## Decision log
- 2026-10-19 — M2 done. `oracle.py`: deterministic leak detector with 11 forms (exact,
  normalized, spaced, reversed, base64, hex, rot13, url, leetspeak, nato, segmented), priority
  ordered; `detect_any` over split secret values catches partial PII (SSN-only) leaks; keylogger
  playbook tagged `oracle_applies: false`. 47 oracle tests (positives per form + negatives incl.
  describe-not-state refusals). Wired into the harness: every round now records BOTH the oracle
  (ground truth) AND the LLM judge, and the judge is called on every round (no short-circuit) so
  M4 can measure judge error vs oracle. 54 tests total pass.
- 2026-10-19 — M3–M7 are blocked on live API runs (keys + the budget decision flagged in
  PLAN "Open decisions"). M5's defenses CODE can be built on the oracle without keys; its
  evaluation cannot. Everything keyless is now done.
- 2026-10-19 — M1 done. Python harness ports the attacker/target/judge loop. All providers
  reached via the `openai` SDK by swapping base_url (one interface). Resume is episode-file
  based (one JSONL line per round, fsync'd) + a content-hash response cache → killed runs
  resume free. One intentional divergence from the demo: the target is NOT shown judge turns
  (the demo fed them as 'assistant' msgs — confusing, risks contaminating results); attacker
  still sees judge feedback. Judge hard-check is a plain substring match for now; M2 swaps in
  the obfuscation-aware oracle. Smoke: 2 episodes × 3 rounds via `--fake`; 8 tests pass.
- 2026-10-19 — M0 done. RQ1 gate stays open (no systematic judge-on-obfuscated-leak study;
  see `docs/related-work.md`). Picked current provider models free-tier-first; defaults mix
  three families (Groq attacker / Gemini target / OpenAI judge) to avoid self-grading.
- 2026-10-19 — Reframed from demo to evaluation study. Primary RQ is judge reliability,
  because playbooks have known secrets → deterministic ground truth, and a quick search
  found practitioners hitting judge FN/FP but no systematic study. Keep the React app as
  the demo surface; put the reproducible harness in Python.

## Glossary
- **ASR** — attack success rate. **ASR@k** — success within k rounds.
- **Oracle** — deterministic leak detector (decodes/normalizes outputs, matches the known secret).
- **FN / FP (judge)** — judge says no leak when the oracle finds one / says leak when none.
