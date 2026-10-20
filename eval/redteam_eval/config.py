"""Config loading: playbooks and experiment run configs (both YAML)."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

PACKAGE_DIR = Path(__file__).resolve().parent
PLAYBOOKS_PATH = PACKAGE_DIR / "playbooks.yaml"


@dataclass(frozen=True)
class Playbook:
    id: str
    name: str
    category: str
    description: str
    target_secret: str
    attacker_goal: str
    target_system_prompt: str

    def system_prompt(self) -> str:
        """Target system prompt with the secret substituted in."""
        return self.target_system_prompt.replace("{SECRET}", self.target_secret)


@dataclass(frozen=True)
class ModelRef:
    provider: str  # "groq" | "google" | "openai"
    id: str

    @property
    def slug(self) -> str:
        """Filesystem-safe identifier (model ids can contain '/')."""
        return f"{self.provider}__{self.id.replace('/', '-')}"


@dataclass
class RunConfig:
    run_id: str
    attacker_model: ModelRef
    target_models: list[ModelRef]
    judge_model: ModelRef
    playbook_ids: list[str]
    max_rounds: int = 5
    seeds: list[int] = field(default_factory=lambda: [0])
    attacker_temperature: float = 0.9
    target_temperature: float = 0.1
    judge_temperature: float = 0.0


def load_playbooks(path: Path | str = PLAYBOOKS_PATH) -> dict[str, Playbook]:
    raw = yaml.safe_load(Path(path).read_text())
    books: dict[str, Playbook] = {}
    for item in raw:
        books[item["id"]] = Playbook(
            id=item["id"],
            name=item["name"],
            category=item["category"],
            description=item["description"].strip(),
            target_secret=item["target_secret"],
            attacker_goal=item["attacker_goal"].strip(),
            target_system_prompt=item["target_system_prompt"].strip(),
        )
    return books


def _model_ref(raw: dict | str) -> ModelRef:
    if isinstance(raw, str):
        # "provider:id" convenience form (id may itself contain '/').
        provider, _, model_id = raw.partition(":")
        return ModelRef(provider=provider, id=model_id)
    return ModelRef(provider=raw["provider"], id=raw["id"])


def load_run_config(path: Path | str) -> RunConfig:
    raw = yaml.safe_load(Path(path).read_text())
    playbooks = raw.get("playbooks", "all")
    if playbooks == "all":
        playbook_ids = list(load_playbooks().keys())
    else:
        playbook_ids = list(playbooks)
    return RunConfig(
        run_id=raw["run_id"],
        attacker_model=_model_ref(raw["attacker_model"]),
        target_models=[_model_ref(m) for m in raw["target_models"]],
        judge_model=_model_ref(raw["judge_model"]),
        playbook_ids=playbook_ids,
        max_rounds=int(raw.get("max_rounds", 5)),
        seeds=[int(s) for s in raw.get("seeds", [0])],
        attacker_temperature=float(raw.get("attacker_temperature", 0.9)),
        target_temperature=float(raw.get("target_temperature", 0.1)),
        judge_temperature=float(raw.get("judge_temperature", 0.0)),
    )
