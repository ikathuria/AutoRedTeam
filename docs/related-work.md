# Related Work & Novelty Note (RQ1)

_Literature search 2026-10-19 (M0 gate). Positions the primary research question —
**how reliably do LLM judges detect obfuscated secret leaks, and how much does judge error
distort reported ASR** — against prior work._

## The M0 gate

> **Gate (from PLAN.md):** if the lit search finds a systematic study of judge error on
> obfuscated secret leaks, reposition RQ1 before M3.

**Verdict: gate stays open — RQ1 proceeds as the primary question.**
The search found (a) a mature literature on LLM-judge reliability for *harmfulness* scoring in
jailbreak evaluation, and (b) practitioner tools and bug reports confirming that canary/secret
checks miss *obfuscated* leaks — but **no systematic study that measures judge false-negative /
false-positive rates on obfuscated secret leakage by leak form, nor quantifies the resulting ASR
distortion.** That gap is RQ1.

## 1. LLM-judge reliability in jailbreak evaluation (closest established line)

The judge-reliability problem is well established for *harmfulness* classification, which gives us
methodology to borrow (report precision/recall vs. a human-labeled sample, κ agreement, avoid
self-grading) but leaves the *secret-leak + obfuscation* axis unstudied.

- **JailbreakBench** (Chao et al., NeurIPS 2024 D&B) — compares judges against human majority
  labels: Llama-3-70B and GPT-4 reach >90% agreement; a rule-based judge only 56% and is
  false-positive-prone. Establishes "judge vs. human agreement" as the standard metric.
  <https://arxiv.org/pdf/2404.01318>
- **How Reliable Is Your Jailbreak Judge? Calibration and Adversarial Robustness of Automated ASR
  Scoring** (2026) — finds a classifier judge with high recall / lower precision vs. small-LLM
  judges with the reverse; recommends reporting judge precision & recall on a human sample; shows
  a GCG attack flips 70% of confident true positives while humans confirm content is still present.
  Directly motivates reporting judge error, not just ASR. <https://arxiv.org/html/2606.25487v2>
- **The Fragility of Jailbreak Robustness Across Operational States** (2026) — keyword judge 62%
  human agreement / 53.2% FP rate vs. 92% for a GPT-4 semantic judge. <https://arxiv.org/pdf/2608.30748>
- **Say It Differently: Linguistic Styles as Jailbreak Vectors** (2025) — LLM judges reliable on
  explicit harmful content but have *blind spots* on subtle cases (GPT-4.1 judge misses them).
  The "blind spot" framing is adjacent to our obfuscated-leak blind spot. <https://arxiv.org/pdf/2511.10519>
- **Jailbreaking to Jailbreak** (Scale, 2025) — attacker self-judging yields high FP; they switch
  to an external judge. Supports our "different family than attacker, avoid self-grading" design.
- **ADVERSA** (2026) — multi-turn guardrail degradation *and* judge reliability.
  <https://arxiv.org/pdf/2603.10068>

**Difference from RQ1:** all score *harmfulness of content*. None have a deterministic ground-truth
oracle (we do, because every playbook has a known secret), and none decompose judge error by
*obfuscation form* (base64/hex/ROT13/spaced/reversed/segmented).

## 2. Secret leakage / canary detection + obfuscation (the actual gap)

Confirms the phenomenon but only in practitioner tooling and bug reports — no systematic measurement.

- **Canary Tokens for LLM Systems** (dev.to tutorial) — explicitly notes a raw substring check
  misses base64-encoded secrets and letter-separated ("spell it with dashes") secrets; proposes an
  obfuscation-aware check. This is essentially our oracle, as a blog, with no evaluation.
  <https://dev.to/royalpinto007/canary-tokens-for-llm-systems-...-5b8b>
- **Injection-arena, issue #21** — "Canary check is verbatim-only, obfuscated canary evades
  auto-crack": base64-of-canary judges as no-leak. A bug report, exactly our FN case.
  <https://github.com/AgentPostmortem/Injection-arena/issues/21>
- **Enhancing Security in LLM Applications: A Performance Evaluation of Early Detection Systems**
  (arXiv 2506.19109, 2025) — default canary checks in Vigil and Rebuff detect *no* prompt leaks in
  their attacks. Closest academic touch-point; about detector tools, not LLM-judge error by form.
  <https://arxiv.org/pdf/2506.19109>
- **LLM as a Judge: Evaluating Accuracy in LLM Security Scans** (Trend Micro) — judge can't detect
  system-prompt leakage when the original system prompt is unknown to it. Motivates our
  system-prompt-extraction playbook (M3) and the oracle-hint judge variant (M4).
- Practitioner repos already noted in PLAN.md: **Gurudarshan25/llm-redteam** (judge quoting →
  missed leaks; a deterministic encoded-leak detector) and **tkarim45/llm-red-teaming-framework**
  (canary scoring; ~20 hand-checked judge labels). Both hit the problem; neither studies it.

## 3. Methods / attacks we cite and position against (not competitors to RQ1)

- Attack generation: **PAIR** (Chao et al. 2023), **TAP**, **HarmBench**.
- Tooling: **garak**, **PyRIT**, **promptfoo** (judge-based scoring we critique).
- Obfuscation/cipher jailbreaks: **Adaptive Stacked Ciphers** (arXiv 2505.16241) — supplies the
  encoding forms our oracle must decode.
- **Got a Secret? LLM Agents Can't Keep It** (2026, arXiv 2605.27766) — lists LLM-judge FP/FN as a
  *limitation*; we turn that limitation into the measured object.

## Positioning (one line for the paper)

> Prior work measures LLM-judge reliability for *harmfulness* and separately notes, in tooling and
> bug reports, that canary checks miss *obfuscated* secret leaks; we are the first to measure judge
> FN/FP **by obfuscation form against a deterministic oracle** and quantify the resulting **ASR
> distortion** across target/judge families.

## Follow-ups before M4

- Deeper arXiv/ACL/NeurIPS-workshop pass once results exist (terms: "prompt leakage evaluation
  judge reliability encoding", "canary obfuscation detection").
- Re-verify no 2026 systematic judge-on-obfuscated-leak study appeared before paper submission.
