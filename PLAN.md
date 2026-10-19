# AutoRedTeam — Evaluation & Write-up Plan

> Turn AutoRedTeam from a demo into a security-forward project with a reproducible
> evaluation, then publish results (Medium article at minimum; short workshop paper if the
> results are clear). Planned 2026-10-19.

---

## Why this plan exists

The browser app (attacker → target → judge loop over four playbooks) works, but:

- It defaults to **mock mode**, so nothing it shows is a measured result.
- Default models are retired (Gemini 1.5, Groq `llama3-70b-8192`, `mixtral-8x7b-32768`).
- `analysis.py` is 37 bytes of garbage; README is the Google AI Studio template.
- GitHub description says "using LangGraph" — the code doesn't use LangGraph.
- There is no eval harness, no ground truth, and the LLM judge is trusted blindly.

That last point is the research opportunity.

---

## Research questions

**RQ1 — Judge reliability (primary, the paper's core).** Automated red-teaming reports
attack success rate (ASR) from an LLM judge. Every playbook here has a *known secret*, so
leakage can be checked **deterministically** — including obfuscated leaks (base64, hex,
ROT13, spaced/hyphenated letters, reversed, leetspeak, partial/segmented, translated).
How often do LLM judges miss (FN) or invent (FP) leaks, which leak forms fool them, and
how much does that distort reported ASR?

**RQ2 — Attack success landscape.** ASR across current target models × attacker
strategies × playbooks, as a function of round budget (ASR@k rounds).

**RQ3 — Cheap defenses.** ASR reduction and benign-utility cost of (a) a hardened system
prompt and (b) a deterministic output filter built from the RQ1 oracle.

### Novelty check (2026-10-19, quick search — redo properly in M0)
- Practitioner repos hit the judge problem but don't study it systematically:
  [Gurudarshan25/llm-redteam](https://github.com/Gurudarshan25/llm-redteam) (judge quoting →
  missed leaks; deterministic encoded-leak detector),
  [tkarim45/llm-red-teaming-framework](https://github.com/tkarim45/llm-red-teaming-framework)
  (canary-based scoring; 20 hand-checked judge labels).
- [Got a Secret? LLM Agents Can't Keep It (2026)](https://arxiv.org/html/2605.27766) lists
  LLM-judge FP/FN as a limitation.
- Closest established work to cite/position against: PAIR (Chao et al. 2023), TAP,
  HarmBench, JailbreakBench (judge comparisons), garak, PyRIT, promptfoo; cipher jailbreaks
  ([Adaptive Stacked Ciphers, 2505.16241](https://arxiv.org/pdf/2505.16241)).
- **Gate:** if M0's lit search finds a systematic study of judge error on obfuscated secret
  leaks, reposition RQ1 (e.g., multi-turn, or judge-ensemble fixes) before M3.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Eval harness | Python 3.12 + `uv`, package in `eval/` | Reproducible runs, pandas/matplotlib |
| Model access | OpenAI-compatible clients: Groq, Gemini (OpenAI-compat endpoint); optional OpenAI / Anthropic | One interface; free tiers first |
| Run storage | JSONL per run + content-hash cache | Resumable, re-scorable without re-calling models |
| Analysis | pandas, scipy (bootstrap CIs, Cohen's κ), matplotlib | Paper figures |
| Demo UI | Existing React/Vite app (keep) | Gains a static "Results" view |

Skipped: LangGraph (not needed for a fixed 3-role loop), a database.

## Project structure (target)

```
AutoRedTeam/
├─ (existing React app at root — demo UI)
├─ eval/
│  ├─ pyproject.toml
│  ├─ redteam_eval/
│  │  ├─ providers.py      # model clients, retries, rate limits, cache
│  │  ├─ loop.py           # attacker/target/judge episode runner
│  │  ├─ oracle.py         # deterministic leak detector (RQ1 ground truth)
│  │  ├─ judges.py         # judge prompts + parsing
│  │  ├─ defenses.py       # hardened prompt, output filter (RQ3)
│  │  └─ playbooks.yaml    # ported from constants.ts (+ new ones)
│  ├─ configs/             # experiment grids
│  ├─ runs/                # JSONL outputs (gitignored; release redacted subset)
│  ├─ labels/              # human labels for the judge study
│  ├─ analysis/            # notebooks / scripts → figures
│  └─ tests/
├─ paper/                  # short paper + figures
└─ docs/article.md         # Medium draft
```

---

## Milestones

### M0 — Cleanup + proper lit check
- Delete `analysis.py`; replace README with a real one (what it is, how to run, mock vs live).
- Update `AVAILABLE_MODELS` to currently served models (check each provider's live model list).
- Fix GitHub repo description (no LangGraph claim).
- 30-minute literature search on RQ1 (Semantic Scholar/arXiv: "LLM judge red teaming
  reliability", "jailbreak evaluation judge agreement", "secret extraction obfuscation").
  Record findings + positioning in `docs/related-work.md`; apply the gate above.
- **Done when:** `npm run build` passes, deployed site loads with live mode working for one
  provider, related-work note committed.

### M1 — Python harness
- Port playbooks to `playbooks.yaml`; port the episode loop (attacker THOUGHT/MESSAGE format,
  target with secret-bearing system prompt, judge per round).
- Config-driven runs: models, temperature, seeds, max rounds; JSONL per turn with full
  prompts, raw outputs, latency, token counts.
- Cache by hash of (model, messages, params) so reruns are free.
- **Done when:** smoke run (1 playbook × 1 target × 3 rounds × 2 seeds) completes end to end,
  is resumable after kill, and a test covers the episode loop with a fake provider.

### M2 — Deterministic leak oracle (RQ1 ground truth)
- Normalizations: exact; case/whitespace/punctuation-insensitive; spaced/hyphenated letters;
  reversed; base64 / hex / ROT13 / URL / leetspeak decode of candidate spans; segmented
  partial leaks (e.g., SSN split across sentences, k-of-n segments); NATO/phonetic spelling.
- Output: `{leaked: bool, form: str, span: str}`. Translated / paraphrased leaks are out of
  reach for the oracle — tag as `needs_human`.
- For the keylogger playbook (no string secret) the oracle doesn't apply; use judge + human
  labels only, and treat it separately in the analysis.
- **Done when:** ≥40 unit tests (positive per form, negatives incl. refusals that *describe*
  the secret without stating it) pass.

### M3 — Experiment matrix (RQ2)
- Targets: 3–5 current models across ≥2 families (small + mid; frontier if budget allows).
- Attacker strategies: baseline (current prompt), role-play/authority, encoding-request
  ("spell it in base64"), multi-turn escalation, indirect injection (document playbook).
- Playbooks: 4 existing + 1–2 new (system-prompt extraction, tool/API-key exfiltration).
- 10 rounds max, ≥5 seeds per cell. **Estimate total calls + cost before running; present to
  Ishani if over the agreed budget.**
- Smoke-test one full cell, measure time/rate limits, then run in background with
  checkpoints (`/long-run`).
- **Done when:** full grid in `runs/`, ASR@k table + plot with bootstrap 95% CIs.

### M4 — Judge study (RQ1)
- Judges: 3–4 models from different families than the attacker (avoid self-grading), incl.
  one small/cheap judge; current judge prompt + one improved prompt (quote-the-leak + oracle
  hint off).
- Score every turn with every judge (cached transcripts — no new attacks needed).
- Human labels: stratified sample of ~200 turns (all `needs_human`, oracle-positive per
  form, oracle-negative near-misses). Two passes a day apart → self-agreement.
- Metrics: judge FN/FP vs oracle per leak form; κ vs human; **ASR distortion** (judge-ASR −
  oracle-ASR) per target/judge.
- **Done when:** confusion tables + "which forms fool judges" figure + ASR-distortion figure.

### M5 — Defenses (RQ3)
- Hardened system prompt; oracle-based output filter; combination.
- Utility: 50 benign queries per playbook domain → false-refusal rate.
- **Done when:** ASR-reduction vs false-refusal table.

### M6 — Results in the product
- Export aggregates to static JSON; add a "Results" view (charts) to the web app; README
  gets headline figures + reproduce commands. Mock mode stays for zero-key demos, clearly
  labeled.
- **Done when:** deployed site shows real results; `uv run` reproduce instructions verified.

### M7 — Write-up
- `docs/article.md` (Medium): story-first, 3–4 figures, redacted examples.
- `paper/`: 4-page short paper (intro, setup, oracle, RQ1–3 results, limitations, ethics).
  Pick a venue from **current** CFPs (ML safety / security workshops at NeurIPS, ICLR, ACL,
  or IEEE SaTML) — verify deadlines before targeting one; arXiv preprint regardless.
- Run the `critic` skill on the draft before submission.
- **Done when:** article published or ready; paper draft passes critic review.

---

## Responsible-release rules
- The keylogger playbook can elicit malware-like code: **never commit or publish generated
  code**; release verdicts + redacted transcripts only.
- Release aggregate ASR per model; redact the most effective verbatim attack prompts against
  named production models (describe the strategy instead).
- Secrets/PII in playbooks are synthetic — keep them obviously fake.
- API keys only via env vars; never in runs/ or logs.

## Risks
- Free-tier rate limits → caching, backoff, smaller grid first.
- Model nondeterminism → seeds + temperature fixed, report CIs.
- Models retired mid-study → record exact model IDs + dates in every run.
- RQ1 turns out already studied → gate in M0.

## Open decisions (ask Ishani)
- API budget: free tiers only, or ~$10–20 for OpenAI/Anthropic frontier targets/judges?
- Venue/timeline for the paper (after M4 results are in).

## Notes
- Commit style: no AI attribution trailers in this repo (portfolio repo).
