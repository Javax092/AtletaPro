from __future__ import annotations

from datetime import datetime, UTC
from typing import Any


def _position_weight(position: str) -> float:
    weights = {
        "Goleiro": 1.1,
        "Zagueiro": 1.0,
        "Lateral": 1.04,
        "Volante": 1.03,
        "Meio-campo": 1.05,
        "Ponta": 1.07,
        "Atacante": 1.06,
    }
    return weights.get(position, 1.0)


def build_match_recommendation(
    athletes: list[dict[str, Any]],
    profiles: list[dict[str, Any]],
    latest_scores: list[dict[str, Any]],
    match_row: dict[str, Any],
) -> dict[str, Any]:
    profile_map = {item["athlete_id"]: item for item in profiles}
    risk_map = {item["athlete_id"]: item for item in latest_scores}

    enriched: list[dict[str, Any]] = []
    for athlete in athletes:
        profile = profile_map.get(athlete["id"], {})
        risk = risk_map.get(athlete["id"], {})
        suitability = (
            float(profile.get("physical_score", 70)) * 0.42
            + float(profile.get("technical_score", 70)) * 0.25
            + float(profile.get("availability_score", 70)) * 0.21
            + float(risk.get("readiness_score", 70)) * 0.12
        ) * _position_weight(athlete["position"])

        enriched.append(
            {
                "athlete_id": athlete["id"],
                "full_name": athlete["full_name"],
                "position": athlete["position"],
                "availability_status": athlete["availability_status"],
                "risk_level": risk.get("risk_level", "LOW"),
                "risk_probability": round(float(risk.get("risk_probability", 0.2)), 3),
                "readiness_score": round(float(risk.get("readiness_score", 72)), 1),
                "suitability_score": round(suitability, 1),
            }
        )

    available = [item for item in enriched if item["availability_status"] in {"AVAILABLE", "MONITORING"}]
    unavailable = [item for item in enriched if item["availability_status"] == "UNAVAILABLE"]
    controlled = [item for item in enriched if item["availability_status"] == "RETURN_TO_PLAY" or item["risk_probability"] >= 0.58]

    lineup = sorted(available, key=lambda item: item["suitability_score"], reverse=True)[:11]
    bench = sorted([item for item in available if item not in lineup], key=lambda item: item["suitability_score"], reverse=True)[:7]
    watchlist = sorted(controlled, key=lambda item: item["risk_probability"], reverse=True)[:6]

    lineup_ids = {item["athlete_id"] for item in lineup}
    for player in lineup:
        player["justification"] = (
            f"Escolhido por prontidão {player['readiness_score']}, risco {player['risk_level']} "
            f"e equilíbrio setorial para a partida contra {match_row['opponent']}."
        )
        player["minutes_guidance"] = "Controle de minutos" if player["risk_probability"] >= 0.45 else "Sem restrição inicial"

    for player in bench:
        player["justification"] = "Reserva estratégica por bom nível recente e cobertura de setor."

    for player in unavailable:
        player["reason"] = "Indisponível para a partida atual no ambiente demo."

    for player in watchlist:
        player["recommendation"] = "Usar com controle de carga e revisão no aquecimento."

    summary = (
        f"Time ideal sugerido para {match_row['opponent']} com foco em disponibilidade, controle de risco e manutenção de intensidade competitiva."
    )

    return {
        "match_id": match_row["id"],
        "lineup_json": lineup,
        "bench_json": bench,
        "unavailable_json": unavailable,
        "watchlist_json": watchlist,
        "summary": summary,
        "generated_at": datetime.now(UTC).isoformat(),
    }
