from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score

from app.data.load_datasets import VALID_DATASET_TYPES, load_all_datasets
from app.ml.build_features import TARGET_COLUMN, build_features
from app.ml.train_model import (
    build_default_model,
    load_artifact,
    prepare_inference_frame,
    prepare_training_frame,
    save_artifact,
    split_training_data,
)
from app.utils.logger import log
from app.utils.settings import settings


DEFAULT_MULTI_DATASET_MODEL_PATH = Path("models") / "injury_model_multi.pkl"
RISK_LABELS = ("Baixo risco", "Risco moderado", "Alto risco")


def resolve_dataset_path(dataset_path: str | Path) -> Path:
    path = Path(dataset_path)
    candidates = [path]

    if not path.is_absolute():
        candidates.extend(
            [
                Path.cwd() / path,
                Path(settings.storage_dir).resolve() / path,
                Path(settings.demo_storage_dir) / path,
            ]
        )

    for candidate in candidates:
        if candidate.exists():
            return candidate.resolve()

    raise FileNotFoundError(f"Dataset not found: {dataset_path}")


def _normalize_dataset_paths(dataset_paths: list[str]) -> list[str]:
    resolved_paths = [str(resolve_dataset_path(dataset_path)) for dataset_path in dataset_paths]
    return resolved_paths


def _risk_label(value: float) -> str:
    if value >= 0.67:
        return "Alto risco"
    if value >= 0.34:
        return "Risco moderado"
    return "Baixo risco"


def _risk_distribution(series: pd.Series) -> dict[str, int]:
    numeric_series = pd.to_numeric(series, errors="coerce").fillna(0.0)
    return {
        "Baixo risco": int((numeric_series < 0.34).sum()),
        "Risco moderado": int(((numeric_series >= 0.34) & (numeric_series < 0.67)).sum()),
        "Alto risco": int((numeric_series >= 0.67).sum()),
    }


def _safe_mean(series: pd.Series) -> float:
    numeric_series = pd.to_numeric(series, errors="coerce")
    value = numeric_series.mean()
    if pd.isna(value):
        return 0.0
    return float(value)


def _prepare_training_dataset(df: pd.DataFrame) -> pd.DataFrame:
    training_df = df.copy()
    training_df["source_athlete_id"] = training_df["athleteId"].astype(str)
    training_df["athleteId"] = (
        training_df["dataset_type"].astype(str) + "::" + training_df["source_athlete_id"].astype(str)
    )
    return training_df


def _build_scenario_model_input(raw_df: pd.DataFrame, dataset_type: str, feature_columns: list[str]) -> pd.DataFrame:
    dataset_frame = raw_df.loc[raw_df["dataset_type"] == dataset_type].copy()
    if dataset_frame.empty:
        raise ValueError(f"No rows available for dataset_type '{dataset_type}'")

    dataset_frame[TARGET_COLUMN] = pd.to_numeric(dataset_frame[TARGET_COLUMN], errors="coerce")
    selected_row = (
        dataset_frame.sort_values([TARGET_COLUMN, "workload", "recordedAt"], ascending=[False, False, False])
        .head(1)
        .iloc[0]
    )
    athlete_history = dataset_frame.loc[dataset_frame["athleteId"] == selected_row["athleteId"]].copy()
    athlete_history = _prepare_training_dataset(athlete_history)
    featured_history = build_features(athlete_history)
    latest_row = featured_history.sort_values(["athleteId", "recordedAt"]).iloc[[-1]].copy()
    return prepare_inference_frame(latest_row, feature_columns)


def _build_top_risk_athletes(df: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    grouped = (
        df.groupby(["dataset_type", "athleteId"], as_index=False)
        .agg(
            records=("athleteId", "size"),
            avg_workload=("workload", "mean"),
            avg_fatigue=("fatigueLevel", "mean"),
            avg_injury_risk=("injuryRisk7d", "mean"),
            max_injury_risk=("injuryRisk7d", "max"),
            latest_recorded_at=("recordedAt", "max"),
        )
        .sort_values(["max_injury_risk", "avg_injury_risk", "avg_workload"], ascending=[False, False, False])
        .head(limit)
    )

    athletes: list[dict[str, Any]] = []
    for row in grouped.to_dict(orient="records"):
        max_risk = 0.0 if pd.isna(row["max_injury_risk"]) else float(row["max_injury_risk"])
        athletes.append(
            {
                "athlete_id": str(row["athleteId"]),
                "dataset_type": str(row["dataset_type"]),
                "records": int(row["records"]),
                "average_workload": round(0.0 if pd.isna(row["avg_workload"]) else float(row["avg_workload"]), 4),
                "average_fatigue": round(0.0 if pd.isna(row["avg_fatigue"]) else float(row["avg_fatigue"]), 4),
                "average_injury_risk": round(
                    0.0 if pd.isna(row["avg_injury_risk"]) else float(row["avg_injury_risk"]),
                    4,
                ),
                "max_injury_risk": round(max_risk, 4),
                "risk_label": _risk_label(max_risk),
                "latest_recorded_at": str(row["latest_recorded_at"]),
            }
        )

    return athletes


def analyze_dataset_distribution(df: pd.DataFrame) -> dict[str, dict[str, Any]]:
    if df.empty:
        return {}

    result: dict[str, dict[str, Any]] = {}
    for dataset_type, group in df.groupby("dataset_type", sort=False):
        numeric_risk = pd.to_numeric(group[TARGET_COLUMN], errors="coerce").fillna(0.0)
        result[str(dataset_type)] = {
            "rows": int(len(group)),
            "athletes": int(group["athleteId"].nunique()),
            "average_workload": round(_safe_mean(group["workload"]), 4),
            "average_fatigue_level": round(_safe_mean(group["fatigueLevel"]), 4),
            "average_injury_risk": round(_safe_mean(numeric_risk), 4),
            "risk_distribution": _risk_distribution(numeric_risk),
            "top_risk_athletes": _build_top_risk_athletes(group, limit=5),
        }

    return result


def build_dashboard_payload(df: pd.DataFrame) -> dict[str, Any]:
    comparison_visual = []
    dataset_distribution = analyze_dataset_distribution(df)
    for dataset_type in VALID_DATASET_TYPES:
        if dataset_type not in dataset_distribution:
            continue

        summary = dataset_distribution[dataset_type]
        comparison_visual.append(
            {
                "dataset_type": dataset_type,
                "risk_label": _risk_label(float(summary["average_injury_risk"])),
                "average_risk": summary["average_injury_risk"],
                "average_workload": summary["average_workload"],
                "average_fatigue_level": summary["average_fatigue_level"],
                "rows": summary["rows"],
            }
        )

    return {
        "risk_average_by_dataset": {
            dataset_type: stats["average_injury_risk"]
            for dataset_type, stats in dataset_distribution.items()
        },
        "top_risk_athletes": _build_top_risk_athletes(df, limit=10),
        "comparison_visual": comparison_visual,
        "labels": list(RISK_LABELS),
    }


def simulate_scenarios(model: Any) -> dict[str, float]:
    if not isinstance(model, dict):
        raise ValueError("simulate_scenarios expects an artifact dictionary")

    scenario_rows = model.get("scenario_source_rows") or []
    feature_columns = model.get("feature_columns") or []
    if not scenario_rows or not feature_columns:
        raise ValueError("Artifact does not contain scenario source rows")

    scenario_frame = pd.DataFrame(scenario_rows)
    predictions: dict[str, float] = {}

    for dataset_type in ("low_risk", "main", "high_risk"):
        if scenario_frame.loc[scenario_frame["dataset_type"] == dataset_type].empty:
            continue

        model_input = _build_scenario_model_input(scenario_frame, dataset_type, feature_columns)
        probability = float(model["model"].predict_proba(model_input)[0, 1])
        predictions[f"{dataset_type}_example"] = round(probability, 4)

    return predictions


def _build_metrics(model: Any, X_test: pd.DataFrame, y_test: pd.Series) -> dict[str, float | None]:
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)) if y_test.nunique() > 1 else None,
    }


def train_multi_dataset(
    dataset_paths: list[str],
    model_output_path: str | Path | None = None,
) -> dict[str, Any]:
    normalized_paths = _normalize_dataset_paths(dataset_paths)
    raw_df = load_all_datasets(normalized_paths)
    dataset_distribution = analyze_dataset_distribution(raw_df)
    dashboard_payload = build_dashboard_payload(raw_df)

    training_df = _prepare_training_dataset(raw_df)
    feature_df = build_features(training_df)
    X, y, feature_columns = prepare_training_frame(feature_df)
    X_train, X_test, y_train, y_test = split_training_data(X, y)

    model = build_default_model()
    model.fit(X_train, y_train)
    metrics = _build_metrics(model, X_test, y_test)

    artifact = {
        "model": model,
        "feature_columns": feature_columns,
        "target_column": TARGET_COLUMN,
        "metrics": metrics,
        "dataset_paths": normalized_paths,
        "dataset_distribution": dataset_distribution,
        "dashboard_payload": dashboard_payload,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "rows_total": int(len(raw_df)),
        "rows_trained": int(len(X_train)),
        "rows_tested": int(len(X_test)),
        "scenario_source_rows": raw_df.to_dict(orient="records"),
    }
    output_path = save_artifact(artifact, model_output_path or settings.multi_dataset_model_file)
    scenario_predictions = simulate_scenarios(artifact)

    artifact["scenario_predictions"] = scenario_predictions
    output_path = save_artifact(artifact, output_path)

    response = {
        "metrics": metrics,
        "rows_total": int(len(raw_df)),
        "rows_trained": int(len(X_train)),
        "rows_tested": int(len(X_test)),
        "feature_columns": feature_columns,
        "dataset_distribution": dataset_distribution,
        "scenario_predictions": scenario_predictions,
        "dashboard_payload": dashboard_payload,
        "model_path": str(output_path),
        "dataset_paths": normalized_paths,
        "trained_at": artifact["trained_at"],
    }
    log(
        "info",
        "ml.train_multi_dataset.completed",
        rowsTotal=response["rows_total"],
        rowsTrained=response["rows_trained"],
        rowsTested=response["rows_tested"],
        modelPath=response["model_path"],
    )
    return response


def load_multi_dataset_artifact(model_path: str | Path | None = None) -> dict[str, Any]:
    return load_artifact(model_path or settings.multi_dataset_model_file)


def get_dataset_analysis(
    dataset_paths: list[str] | None = None,
    model_path: str | Path | None = None,
) -> dict[str, Any]:
    if dataset_paths:
        normalized_paths = _normalize_dataset_paths(dataset_paths)
        raw_df = load_all_datasets(normalized_paths)
        analysis = analyze_dataset_distribution(raw_df)
        dashboard_payload = build_dashboard_payload(raw_df)
        return {
            "dataset_distribution": analysis,
            "dashboard_payload": dashboard_payload,
            "top_risk_athletes": dashboard_payload["top_risk_athletes"],
            "dataset_paths": normalized_paths,
        }

    artifact = load_multi_dataset_artifact(model_path)
    return {
        "dataset_distribution": artifact.get("dataset_distribution", {}),
        "dashboard_payload": artifact.get("dashboard_payload", {}),
        "top_risk_athletes": artifact.get("dashboard_payload", {}).get("top_risk_athletes", []),
        "scenario_predictions": artifact.get("scenario_predictions", {}),
        "dataset_paths": artifact.get("dataset_paths", []),
        "trained_at": artifact.get("trained_at"),
        "model_path": str(model_path or settings.multi_dataset_model_file),
    }


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train the athlete injury risk model with multiple datasets")
    parser.add_argument("datasets", nargs="+", help="CSV datasets used for training")
    parser.add_argument(
        "--output",
        type=str,
        default=str(settings.multi_dataset_model_file),
        help="Output path for the serialized model artifact",
    )
    return parser


def main() -> None:
    parser = _build_argument_parser()
    args = parser.parse_args()
    result = train_multi_dataset(args.datasets, args.output)

    print("Multi-dataset training complete")
    print(f"Model saved to: {result['model_path']}")
    print(f"Rows total: {result['rows_total']}")
    print(f"Rows trained: {result['rows_trained']}")
    print(f"Rows tested: {result['rows_tested']}")
    print(f"Accuracy: {result['metrics']['accuracy']:.4f}")
    print(f"F1 score: {result['metrics']['f1_score']:.4f}")
    roc_auc = result["metrics"]["roc_auc"]
    print(f"ROC AUC: {roc_auc:.4f}" if roc_auc is not None else "ROC AUC: unavailable (single-class test split)")
    print("Scenario predictions:")
    for key, value in result["scenario_predictions"].items():
        print(f"  {key}: {value:.4f}")


if __name__ == "__main__":
    main()
