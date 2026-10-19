# AutoRedTeam — Project Tracker

> Living context map. Keep in sync whenever structure, status, or decisions change.

_Last updated: 2026-10-19_

## What it is
A multi-agent LLM red-teaming simulator: an **attacker** model tries to extract a protected
secret (or elicit prohibited output) from a **target** model over several rounds, and a
**judge** model scores each round. Four playbooks: secret leakage, PII extraction,
malicious-code jailbreak, indirect prompt injection. Being extended into a reproducible
evaluation study of **LLM-judge reliability on obfuscated leaks** — see PLAN.md.

## Current state (audit, 2026-10-19)
- React 19 + Vite + TypeScript browser app; provider clients for Gemini, Groq, OpenAI
  (`services/`), user-supplied API keys via modal; deployed to GitHub Pages
  (`.github/workflows/deploy.yml`) at ishani.kathuria.net/AutoRedTeam.
- Defaults to **mock mode** (scripted turns) — no measured results exist yet.
- Default model IDs are retired; `analysis.py` is junk; README is AI Studio boilerplate.
- No tests, no eval harness.

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
eval/ (planned) — see PLAN.md
```

## Status
| Milestone | Status |
|---|---|
| M0 Cleanup + lit check | ⏳ next |
| M1 Python harness | — |
| M2 Leak oracle | — |
| M3 Experiment matrix | — |
| M4 Judge study | — |
| M5 Defenses | — |
| M6 Results in UI | — |
| M7 Write-up | — |

## Decision log
- 2026-10-19 — Reframed from demo to evaluation study. Primary RQ is judge reliability,
  because playbooks have known secrets → deterministic ground truth, and a quick search
  found practitioners hitting judge FN/FP but no systematic study. Keep the React app as
  the demo surface; put the reproducible harness in Python.

## Glossary
- **ASR** — attack success rate. **ASR@k** — success within k rounds.
- **Oracle** — deterministic leak detector (decodes/normalizes outputs, matches the known secret).
- **FN / FP (judge)** — judge says no leak when the oracle finds one / says leak when none.
