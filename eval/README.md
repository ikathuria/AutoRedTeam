# redteam-eval

Reproducible evaluation harness for AutoRedTeam: a config-driven attacker → target → judge
episode runner with per-turn JSONL logging, a content-hash response cache, and crash-safe
resume. Ported from the browser demo's loop (see repo root `PLAN.md`, milestone M1).

## Setup

```bash
cd eval
uv sync --extra dev          # create venv + install deps (+ pytest)
```

## Run

```bash
# Offline smoke run — no API keys needed (keyless FakeBackend):
uv run redteam-eval --config configs/smoke.yaml --fake

# Live run — set keys first (only the providers you use are required):
export GROQ_API_KEY=...  GEMINI_API_KEY=...  OPENAI_API_KEY=...
uv run redteam-eval --config configs/smoke.yaml
```

Outputs land in `runs/<run_id>/<playbook>__<provider>__<model>__seed<n>.jsonl` — one JSON
line per round with the full prompts, raw outputs, latency and token counts for all three
roles. Model responses are cached under `runs/cache/` keyed by a hash of (provider, model,
messages, params), so **reruns are free** and a killed run resumes from the last completed
round. `runs/` is gitignored.

## Tests

```bash
uv run pytest            # episode loop, early-stop, resume-after-kill, cache (fake providers)
```

## Layout

```
redteam_eval/
  config.py       # Playbook / ModelRef / RunConfig + YAML loaders
  playbooks.yaml  # the 4 playbooks (ported from constants.ts; synthetic secrets)
  prompts.py      # attacker / judge system prompts
  providers.py    # OpenAI-compatible backends (Groq/Gemini/OpenAI), cache, retries, FakeBackend
  judges.py       # hard substring check + LLM judge (JSON-parsed)
  loop.py         # episode runner + JSONL + resume
  __main__.py     # CLI (redteam-eval)
configs/          # experiment grids (smoke.yaml)
tests/            # fake-provider tests
```

Providers are reached through the `openai` SDK by swapping `base_url` (verified 2026-10-19):
Groq `https://api.groq.com/openai/v1`, Gemini
`https://generativelanguage.googleapis.com/v1beta/openai/`, OpenAI default.

The deterministic leak **oracle** (RQ1 ground truth) arrives in M2 and replaces the plain
substring hard-check; the LLM judge becomes the object of study in M4.
