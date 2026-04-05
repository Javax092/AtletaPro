from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.ml.build_features import REQUIRED_COLUMNS, TARGET_COLUMN


VALID_DATASET_TYPES: tuple[str, ...] = ("main", "high_risk", "low_risk")
REQUIRED_DATASET_COLUMNS: tuple[str, ...] = (*REQUIRED_COLUMNS, TARGET_COLUMN)


def _infer_dataset_type(dataset_path: str | Path) -> str:
    stem = Path(dataset_path).stem.lower()
    if "high_risk" in stem:
        return "high_risk"
    if "low_risk" in stem:
        return "low_risk"
    if "main" in stem:
        return "main"
    return stem.removeprefix("dataset_")


def _validate_required_columns(dataset_name: str, df: pd.DataFrame) -> None:
    missing_columns = [column for column in REQUIRED_DATASET_COLUMNS if column not in df.columns]
    if missing_columns:
        missing = ", ".join(missing_columns)
        raise ValueError(f"Dataset '{dataset_name}' is missing required columns: {missing}")


def load_all_datasets(dataset_paths: list[str]) -> pd.DataFrame:
    if not dataset_paths:
        raise ValueError("At least one dataset path must be provided")

    frames: list[pd.DataFrame] = []
    for dataset_path in dataset_paths:
        resolved_path = Path(dataset_path)
        if not resolved_path.exists():
            raise FileNotFoundError(f"Dataset not found: {resolved_path}")

        dataset_type = _infer_dataset_type(resolved_path)
        frame = pd.read_csv(resolved_path)
        _validate_required_columns(resolved_path.name, frame)
        frame = frame.copy()
        frame["dataset_type"] = dataset_type
        frame["dataset_source"] = str(resolved_path.resolve())
        frames.append(frame)

    combined = pd.concat(frames, ignore_index=True)
    _validate_required_columns("combined", combined)
    if "dataset_type" not in combined.columns:
        raise ValueError("Combined dataset is missing 'dataset_type'")

    return combined
