from __future__ import annotations

from pathlib import Path
from typing import Any

from app.demo.generate_demo_environment import generate_demo_environment
from app.ml.train_model import train_model
from app.utils.settings import settings


def train_demo_model(output_path: str | Path | None = None) -> dict[str, Any]:
    environment = generate_demo_environment(club_name=settings.demo_club_name)
    dataset_path = settings.demo_storage_dir / "demo_training_dataset.csv"
    environment.training_dataframe().to_csv(dataset_path, index=False)
    return train_model(dataset_path, output_path or settings.demo_model_file)

