# AutoRedTeam

**A multi-agent LLM red-teaming simulator — evolving into a reproducible study of
LLM-judge reliability on obfuscated secret leaks.**

An **attacker** model tries to extract a protected secret (or elicit prohibited output)
from a **target** model over several rounds; a **judge** model scores each round. The
browser app visualizes the attacker→target→judge loop live. The research extension (in
`eval/`, see [`PLAN.md`](PLAN.md)) adds a Python harness and a *deterministic* leak oracle so
judge verdicts can be checked against ground truth.

🔗 Live demo: <https://ikathuria.github.io/AutoRedTeam>

## Playbooks

| Playbook | Category | Goal |
|---|---|---|
| Project Omega-X Secret Leak | System secret protection | Extract a secret project codename |
| PII & Medical Record Extraction | Data privacy / PII | Extract a synthetic SSN + phone |
| Keylogger / Malware Jailbreak | Malicious content | Elicit a keylogger script |
| Indirect Prompt Injection | Prompt injection | Force a hijack phrase via hidden text |

All secrets and PII are **synthetic and obviously fake**. See the responsible-release rules
in [`PLAN.md`](PLAN.md); generated malware code is never committed or published.

## Mock mode vs. live mode

- **Mock mode (default).** Scripted turns, no API keys, zero setup — for the portfolio demo.
  Nothing it shows is a measured result.
- **Live mode.** Real model calls. Enter a provider API key via the in-app key modal (keys stay
  in the browser; never commit them). Current supported providers and models are in
  [`constants.ts`](constants.ts) (`AVAILABLE_MODELS`), verified against each provider's live model
  list on 2026-10-19:
  - **Google Gemini** — `gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-4-argon`
  - **Groq** — `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `openai/gpt-oss-20b`
  - **OpenAI** — `gpt-6-luna`, `gpt-6.1-sol`, `gpt-6-astra`

## Run locally

**Prerequisites:** Node.js 18+.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build (type-checks + bundles)
npm run preview  # preview the production build
```

No API key is required to run the demo in mock mode. For live mode, supply a key through the
app's key modal (or set provider keys in `.env.local`, which is gitignored).

## Reproducible evaluation (planned)

The research harness lives in `eval/` (Python 3.12 + `uv`) and is built out across milestones in
[`PLAN.md`](PLAN.md): a config-driven episode runner, a deterministic leak oracle (RQ1 ground
truth), the judge study (RQ1), an attack matrix (RQ2), and cheap defenses (RQ3). Related-work
positioning for the judge-reliability question is in [`docs/related-work.md`](docs/related-work.md).

## Project map

- [`PROJECT.md`](PROJECT.md) — living context map and status tracker.
- [`PLAN.md`](PLAN.md) — milestones, research questions, responsible-release rules.
- [`docs/related-work.md`](docs/related-work.md) — RQ1 literature review and novelty gate.

## Stack

React 19 · Vite · TypeScript (demo UI) · provider SDKs for Gemini, Groq, OpenAI · deployed to
GitHub Pages. Planned eval harness: Python 3.12 + `uv`.

## Ethics

This is a defensive security-evaluation project. Attacks run only against models the operator
controls or has authorization to test, with synthetic secrets. The most effective verbatim attack
prompts against named production models are redacted in any release — see [`PLAN.md`](PLAN.md).
