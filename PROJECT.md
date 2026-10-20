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
docs/BRAND.md + styles/tokens.css — "Signal Lab" design system (Tailwind CDN tokens)
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
| M3 Experiment matrix | 🟡 analysis code done (ASR@k); live run blocked on keys + budget |
| M4 Judge study | 🟡 analysis code done (confusion/distortion); needs run data + human labels |
| M5 Defenses | 🟡 code done (prompt + oracle filter + benign set); eval blocked on keys |
| M6 Results in UI | — |
| M7 Write-up | — |

## Decision log
- 2026-10-20 — UI rebranded via brand-studio to **"Signal Lab"** (fusion of the two directions
  Ishani liked: dark "Signal Console" + light "Lab Report"). Tokens in `styles/tokens.css`
  (RGB-channel CSS vars → Tailwind CDN config in index.html), guidelines in `docs/BRAND.md`.
  Dark default (simulator); light `[data-theme="light"]` palette defined for the M6 Results view.
  Retired slate+indigo defaults across header/config/transcript/telemetry/modal + chart colors.
  Fonts: Inter Tight (display) / IBM Plex Sans (body) / IBM Plex Mono (data). Build passes;
  visual/axe/Lighthouse audits deferred (no browser in session); contrast matrix in BRAND.md is ≥AA.
- 2026-10-19 — API budget decision: **free tiers only** (Ishani). M3 grid uses Groq (Llama
  3.3 70B, Llama 3.1 8B, gpt-oss-20b) + Gemini (3.8 Flash, 3.5 Flash-Lite) = 5 targets / 3
  families; attacker Llama 3.3 70B, judge Gemini 3.8 Flash (different family). `configs/m3_matrix.yaml`
  authored (100 episodes, ~3,000 calls upper bound, $0; rate limits are the constraint). To run:
  set keys, then background-run with /long-run. Remaining keyless M3 code: attacker-strategy
  variants (role-play/encoding/multi-turn/indirect) + 2 new playbooks (system-prompt extraction,
  key exfiltration) — not yet built.
- 2026-10-19 — M3/M4 analysis tooling done (eval blocked on keys). `metrics.py`: pure functions
  over run JSONL — `asr_at_k` (RQ2, oracle- or judge-based), `judge_oracle_confusion` (RQ1
  TP/FP/FN/TN + FN-by-leak-form = "which forms fool judges"), `asr_distortion` (judge ASR −
  oracle ASR), `needs_human` (oracle-neg/judge-pos stratum for M4 labelling). 6 tests on
  synthetic + verified on real fake-run JSONL; 68 tests total. Real figures/tables need M3 run
  data. Plotting (matplotlib) deferred — needs data, lives in the `analysis` extra.
- 2026-10-19 — M5 code done (eval blocked on keys). `defenses.py`: hardened system-prompt
  preamble (prompt defense) + deterministic oracle-based output filter that blocks leaks in
  any oracle-recognised form (catches what the judge misses). Modes none|prompt|filter|both via
  `RunConfig.defense`, wired into the loop; each round records raw+filtered target response and
  whether the filter fired. `benign_queries.yaml` seed utility set (~15/domain; extend to
  ~50/domain for the run) for false-refusal rate. 8 defense tests incl. end-to-end filter;
  62 tests total. The ASR-reduction vs false-refusal TABLE (M5 done-when) needs live runs.
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
