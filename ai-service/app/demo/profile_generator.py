from __future__ import annotations

from datetime import datetime, UTC
from typing import Any


def _bounded(value: float) -> float:
    return max(0.0, min(100.0, round(value, 1)))


def build_profiles(athletes: list[dict[str, Any]], latest_scores: list[dict[str, Any]], latest_loads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    score_map = {item["athlete_id"]: item for item in latest_scores}
    load_map = {item["athlete_id"]: item for item in latest_loads}
    profiles: list[dict[str, Any]] = []

    for athlete in athletes:
        athlete_id = athlete["id"]
        risk = score_map.get(athlete_id, {})
        load = load_map.get(athlete_id, {})
        risk_probability = float(risk.get("risk_probability", 0.18))
        readiness_score = float(risk.get("readiness_score", 72))
        recovery_score = float(risk.get("recovery_score", 71))
        load_score = float(risk.get("load_score", 69))

        physical_score = _bounded(readiness_score * 0.62 + recovery_score * 0.38)
        technical_bonus = 7 if athlete["position"] in {"Ponta", "Atacante", "Meio-campo"} else 3
        technical_score = _bounded(68 + technical_bonus + (load.get("distance_meters", 0) / 10000) * 9)
        availability_score = _bounded(100 - risk_probability * 42 - (0 if athlete["availability_status"] == "AVAILABLE" else 18))
        risk_score = _bounded(risk_probability * 100)

        if athlete["availability_status"] == "RETURN_TO_PLAY":
            trend_label = "retorno_controlado"
            summary = "Atleta em retorno progressivo, com sinais positivos de resposta, mas ainda exigindo controle de minutos e carga."
        elif risk_probability >= 0.62:
            trend_label = "risco_em_alta"
            summary = "Atleta em elevação de fadiga, com piora de recuperação subjetiva e necessidade de controle de minutos."
        elif readiness_score >= 78 and risk_probability <= 0.28:
            trend_label = "prontidao_alta"
            summary = "Atleta com boa tolerância à carga, estabilidade recente no microciclo e prontidão competitiva acima da média."
        elif athlete["position"] in {"Ponta", "Atacante"}:
            trend_label = "explosivo_estavel"
            summary = "Atleta com perfil explosivo, boa repetição de ações intensas e baixo risco atual."
        else:
            trend_label = "controle_estavel"
            summary = "Atleta com estabilidade recente, resposta coerente de carga e bom encaixe para a rotina competitiva."

        profiles.append(
            {
                "athlete_id": athlete_id,
                "status": athlete["availability_status"],
                "physical_score": physical_score,
                "technical_score": technical_score,
                "availability_score": availability_score,
                "risk_score": risk_score,
                "trend_label": trend_label,
                "summary": summary,
                "payload_json": {
                    "position": athlete["position"],
                    "readinessScore": readiness_score,
                    "recoveryScore": recovery_score,
                    "loadScore": load_score,
                },
                "generated_at": datetime.now(UTC).isoformat(),
            }
        )

    return profiles
