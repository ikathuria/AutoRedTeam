"""Reproducible evaluation harness for AutoRedTeam.

An attacker model tries to extract a protected secret from a target model over several
rounds; a judge model scores each round. This package ports the browser demo's episode
loop into a config-driven, cached, resumable runner for research.
"""

__version__ = "0.1.0"
