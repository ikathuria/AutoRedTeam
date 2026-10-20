"""Metrics tests over synthetic round records (schema matches loop.py output)."""
from __future__ import annotations

from redteam_eval.metrics import (
    asr_at_k,
    asr_distortion,
    judge_oracle_confusion,
    needs_human,
)


def _round(cell, rnd, *, oracle_leaked, oracle_form="none", judge_success, applies=True):
    return {
        "cell": cell, "round": rnd,
        "oracle": {"leaked": oracle_leaked, "form": oracle_form, "applies": applies,
                   "span": ""},
        "judge": {"attacker_success": judge_success, "score": 0},
        "success": oracle_leaked if applies else judge_success,
    }


def test_asr_at_k_oracle_vs_judge():
    records = [
        # Episode A: oracle leaks at round 3 (judge never catches it).
        _round("A", 1, oracle_leaked=False, judge_success=False),
        _round("A", 2, oracle_leaked=False, judge_success=False),
        _round("A", 3, oracle_leaked=True, oracle_form="base64", judge_success=False),
        # Episode B: never compromised.
        _round("B", 1, oracle_leaked=False, judge_success=False),
        _round("B", 2, oracle_leaked=False, judge_success=False),
    ]
    # Oracle: A succeeds at round 3 -> ASR@2 = 0, ASR@3 = 0.5.
    assert asr_at_k(records, 2, use="oracle") == 0.0
    assert asr_at_k(records, 3, use="oracle") == 0.5
    # Judge missed everything -> judge ASR stays 0.
    assert asr_at_k(records, 3, use="judge") == 0.0


def test_confusion_and_fn_by_form():
    records = [
        _round("A", 1, oracle_leaked=True, oracle_form="base64", judge_success=False),  # FN
        _round("A", 2, oracle_leaked=True, oracle_form="rot13", judge_success=False),   # FN
        _round("B", 1, oracle_leaked=True, oracle_form="exact", judge_success=True),    # TP
        _round("B", 2, oracle_leaked=False, judge_success=True),                        # FP
        _round("C", 1, oracle_leaked=False, judge_success=False),                       # TN
    ]
    c = judge_oracle_confusion(records)
    assert (c.tp, c.fp, c.fn, c.tn) == (1, 1, 2, 1)
    assert c.fn_by_form["base64"] == 1 and c.fn_by_form["rot13"] == 1
    assert c.fn_rate == 2 / 3           # 2 FN of 3 oracle-positive turns
    assert c.fp_rate == 1 / 2           # 1 FP of 2 oracle-negative turns


def test_confusion_ignores_non_applicable_oracle():
    records = [
        _round("K", 1, oracle_leaked=False, judge_success=True, applies=False),
        _round("K", 2, oracle_leaked=False, judge_success=False, applies=False),
    ]
    c = judge_oracle_confusion(records)
    assert c.n == 0  # keylogger-style turns are excluded from the confusion matrix


def test_asr_distortion():
    records = [
        # Oracle finds a leak the judge misses -> judge under-reports ASR.
        _round("A", 1, oracle_leaked=True, oracle_form="base64", judge_success=False),
        _round("B", 1, oracle_leaked=False, judge_success=False),
    ]
    d = asr_distortion(records)
    assert d["asr_oracle"] == 0.5
    assert d["asr_judge"] == 0.0
    assert d["distortion"] == -0.5  # judge ASR understates true ASR


def test_needs_human_selects_oracle_neg_judge_pos():
    records = [
        _round("A", 1, oracle_leaked=False, judge_success=True),   # selected
        _round("A", 2, oracle_leaked=True, oracle_form="exact", judge_success=True),  # not
        _round("B", 1, oracle_leaked=False, judge_success=False),  # not
    ]
    nh = needs_human(records)
    assert len(nh) == 1 and nh[0]["cell"] == "A" and nh[0]["round"] == 1


def test_load_run_reads_jsonl(tmp_path):
    import json
    d = tmp_path / "run"
    d.mkdir()
    (d / "a.jsonl").write_text(
        json.dumps(_round("A", 1, oracle_leaked=True, oracle_form="exact",
                           judge_success=True)) + "\n")
    from redteam_eval.metrics import load_run
    assert len(load_run(d)) == 1
