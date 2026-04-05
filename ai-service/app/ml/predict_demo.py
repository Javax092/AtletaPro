from __future__ import annotations

from typing import Any

import pandas as pd

from app.ml.train_model import load_artifact, predict_single


def risk_level_from_probability(probability: float) -> str:
    if probability >= 0.62:
        return "HIGH"
    if probability >= 0.34:
        return "MEDIUM"
    return "LOW"


def predict_batch(df: pd.DataFrame, model_path: str) -> list[dict[str, Any]]:
    artifact = load_artifact(model_path)
    results: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        payload = row.to_dict()
        prediction = predict_single(payload, model_path)
        probability = float(prediction["risk_probability"])
        readiness_score = round(max(0.0, 100.0 - probability * 55 - float(payload.get("fatigueLevel", 0)) * 3), 1)
        load_score = round(max(0.0, 100.0 - max(0.0, float(payload.get("workload", 0)) - 420) * 0.08), 1)
        recovery_score = round(max(0.0, 100.0 - max(0.0, 6.8 - float(payload.get("sleepHours", 7))) * 14), 1)

        results.append(
            {
                "athlete_id": payload["athleteId"],
                "recorded_at": payload["recordedAt"],
                "risk_probability": round(probability, 4),
                "risk_level": risk_level_from_probability(probability),
                "readiness_score": readiness_score,
                "load_score": load_score,
                "recovery_score": recovery_score,
                "explanation": (
                    f"Probabilidade baseada em carga recente, fadiga {payload.get('fatigueLevel')}, sono {payload.get('sleepHours')} "
                    f"e sinais de intensidade da sessão."
                ),
                "payload_json": prediction["features_used"],
            }
        )

    return results

