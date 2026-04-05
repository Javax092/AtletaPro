from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.build_features import NUMERIC_COLUMNS, TARGET_COLUMN, build_features


DEFAULT_MODEL_DIR = Path("models")
DEFAULT_MODEL_PATH = DEFAULT_MODEL_DIR / "injury_model.pkl"
RANDOM_STATE = 42


def load_dataset(csv_path: str | Path) -> pd.DataFrame:
    return pd.read_csv(csv_path)


def resolve_feature_columns(feature_frame: pd.DataFrame) -> list[str]:
    excluded = {"athleteId", "recordedAt", TARGET_COLUMN, "dataset_source", "source_athlete_id"}
    feature_columns = [column for column in feature_frame.columns if column not in excluded]
    return feature_columns


def _encode_feature_frame(feature_frame: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
    encoded = feature_frame[feature_columns].copy()
    categorical_columns = [
        column
        for column in encoded.columns
        if pd.api.types.is_object_dtype(encoded[column]) or pd.api.types.is_categorical_dtype(encoded[column])
    ]
    if categorical_columns:
        encoded = pd.get_dummies(encoded, columns=categorical_columns, dtype=float)
    return encoded


def prepare_training_frame(feature_frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    if TARGET_COLUMN not in feature_frame.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found in dataset")

    training_frame = feature_frame.copy()
    raw_feature_columns = resolve_feature_columns(training_frame)
    encoded_features = _encode_feature_frame(training_frame, raw_feature_columns)
    encoded_features = encoded_features.replace([np.inf, -np.inf], np.nan)
    target = pd.to_numeric(training_frame[TARGET_COLUMN], errors="coerce")
    valid_mask = encoded_features.notna().all(axis=1) & target.notna()

    encoded_features = encoded_features.loc[valid_mask].reset_index(drop=True)
    target = target.loc[valid_mask].reset_index(drop=True)

    if encoded_features.empty:
        raise ValueError("No rows available for training after dropping NaN values")

    if target.nunique() < 2:
        raise ValueError("Training requires at least two target classes")

    feature_columns = list(encoded_features.columns)
    X = encoded_features
    y = target.astype(int)
    return X, y, feature_columns


def prepare_inference_frame(feature_frame: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
    encoded = _encode_feature_frame(feature_frame, resolve_feature_columns(feature_frame))
    encoded = encoded.replace([np.inf, -np.inf], np.nan)
    encoded = encoded.reindex(columns=feature_columns, fill_value=0.0)
    return encoded.fillna(0.0)


def build_default_model() -> LGBMClassifier:
    return LGBMClassifier(
        objective="binary",
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=RANDOM_STATE,
        class_weight="balanced",
    )


def split_training_data(
    X: pd.DataFrame,
    y: pd.Series,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    if len(X) < 2:
        raise ValueError("At least two rows are required to train the model")

    test_size = max(1, int(round(len(X) * 0.2)))
    if test_size >= len(X):
        test_size = 1

    class_counts = y.value_counts()
    stratify_target = y if y.nunique() > 1 and class_counts.min() >= 2 and test_size >= y.nunique() else None
    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=RANDOM_STATE,
        stratify=stratify_target,
    )


def save_artifact(artifact: dict[str, Any], model_output_path: str | Path) -> Path:
    output_path = Path(model_output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, output_path)
    return output_path


def train_model(
    csv_path: str | Path,
    model_output_path: str | Path = DEFAULT_MODEL_PATH,
) -> dict[str, Any]:
    raw_df = load_dataset(csv_path)
    feature_df = build_features(raw_df)
    X, y, feature_columns = prepare_training_frame(feature_df)

    X_train, X_test, y_train, y_test = split_training_data(X, y)

    model = build_default_model()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics: dict[str, float | None] = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)) if y_test.nunique() > 1 else None,
    }

    artifact = {
        "model": model,
        "feature_columns": feature_columns,
        "numeric_columns": list(NUMERIC_COLUMNS),
        "target_column": TARGET_COLUMN,
        "metrics": metrics,
    }
    output_path = save_artifact(artifact, model_output_path)

    return {
        "metrics": metrics,
        "rows_trained": int(len(X_train)),
        "rows_tested": int(len(X_test)),
        "feature_columns": feature_columns,
        "model_path": str(output_path),
    }


def load_artifact(model_path: str | Path = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    return joblib.load(model_path)


def predict_single(data: dict[str, Any], model_path: str | Path = DEFAULT_MODEL_PATH) -> dict[str, Any]:
    """Predict a single athlete risk probability.

    If `data` includes `history`, it should be a list of prior monitoring rows.
    The current row should still be provided at the top level. When no history is
    provided, features are derived from the current row only.
    """

    artifact = load_artifact(model_path)

    payload = dict(data)
    history_rows = payload.pop("history", None)
    rows: list[dict[str, Any]]
    if history_rows:
        rows = [*history_rows, payload]
    else:
        rows = [payload]

    inference_df = pd.DataFrame(rows)
    feature_df = build_features(inference_df)
    latest_row = feature_df.sort_values(["athleteId", "recordedAt"]).iloc[[-1]].copy()
    model_input = prepare_inference_frame(latest_row, artifact["feature_columns"])
    probability = float(artifact["model"].predict_proba(model_input)[0, 1])
    prediction = int(probability >= 0.5)

    return {
        "risk_probability": probability,
        "risk_prediction": prediction,
        "features_used": model_input.to_dict(orient="records")[0],
    }


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train the athlete injury risk model")
    parser.add_argument("csv_path", type=str, help="Path to the training CSV dataset")
    parser.add_argument(
        "--output",
        type=str,
        default=str(DEFAULT_MODEL_PATH),
        help="Output path for the serialized model artifact",
    )
    return parser


def main() -> None:
    parser = _build_argument_parser()
    args = parser.parse_args()
    result = train_model(args.csv_path, args.output)

    print("Training complete")
    print(f"Model saved to: {result['model_path']}")
    print(f"Rows trained: {result['rows_trained']}")
    print(f"Rows tested: {result['rows_tested']}")
    print(f"Accuracy: {result['metrics']['accuracy']:.4f}")
    print(f"F1 score: {result['metrics']['f1_score']:.4f}")
    roc_auc = result["metrics"]["roc_auc"]
    print(f"ROC AUC: {roc_auc:.4f}" if roc_auc is not None else "ROC AUC: unavailable (single-class test split)")


if __name__ == "__main__":
    main()
