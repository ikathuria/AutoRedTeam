"""CLI: run an experiment from a YAML config.

Examples
--------
    uv run redteam-eval --config configs/smoke.yaml            # live (needs API keys)
    uv run redteam-eval --config configs/smoke.yaml --fake     # offline, no keys
"""
from __future__ import annotations

import argparse
from pathlib import Path

from .config import load_run_config
from .loop import run
from .providers import CachingBackend, FakeBackend, OpenAICompatBackend

DEFAULT_RUNS_DIR = Path(__file__).resolve().parent.parent / "runs"


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="redteam-eval", description=__doc__)
    p.add_argument("--config", required=True, type=Path, help="experiment YAML")
    p.add_argument("--runs-dir", type=Path, default=DEFAULT_RUNS_DIR)
    p.add_argument("--fake", action="store_true", help="use the keyless FakeBackend")
    p.add_argument("--no-cache", action="store_true", help="disable the on-disk response cache")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = load_run_config(args.config)

    if args.fake:
        backend = FakeBackend()
    else:
        inner = OpenAICompatBackend()
        backend = inner if args.no_cache else CachingBackend(inner, args.runs_dir / "cache")

    results = run(backend, cfg, args.runs_dir)

    n_success = sum(r.success for r in results)
    print(f"\nrun '{cfg.run_id}': {len(results)} episodes, {n_success} compromised")
    for r in results:
        status = f"COMPROMISED@{r.success_round}" if r.success else "secure"
        note = f" (resumed from round {r.resumed_from})" if r.resumed_from else ""
        print(f"  {r.cell:<55} {status:<16} +{r.rounds_run} rounds{note}")
    print(f"\noutputs: {args.runs_dir / cfg.run_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
