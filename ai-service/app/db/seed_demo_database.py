from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.db.postgres_repository import PostgresRepository
from app.demo.generate_demo_environment import DemoEnvironment


def _latest_daily_loads(environment: DemoEnvironment) -> list[dict[str, Any]]:
    latest_by_athlete: dict[str, dict[str, Any]] = {}
    for row in environment.daily_loads:
        athlete_id = row["athlete_id"]
        if athlete_id not in latest_by_athlete or row["recorded_at"] > latest_by_athlete[athlete_id]["recorded_at"]:
            latest_by_athlete[athlete_id] = row
    return list(latest_by_athlete.values())


def build_alerts(latest_scores: list[dict[str, Any]], athletes: list[dict[str, Any]], latest_loads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    athlete_map = {item["id"]: item for item in athletes}
    load_map = {item["athlete_id"]: item for item in latest_loads}
    alerts: list[dict[str, Any]] = []

    for score in latest_scores:
        athlete = athlete_map[score["athlete_id"]]
        load = load_map[score["athlete_id"]]
        probability = float(score["risk_probability"])
        fatigue = float(load["fatigue_level"])
        soreness = float(load["soreness_level"])
        sleep_hours = float(load["sleep_hours"])
        workload = float(load["workload"])
        severity = "HIGH" if probability >= 0.62 else "MEDIUM" if probability >= 0.34 else "LOW"

        if probability >= 0.62:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": severity,
                    "title": "Alto risco de lesão",
                    "reason": "Probabilidade de risco elevada combinada com sinais recentes de fadiga e recuperação abaixo do ideal.",
                    "recommendation": "Reduzir exposição em alta intensidade e revisar minutos da próxima sessão/jogo.",
                    "category": "injury-risk",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"riskProbability": probability},
                }
            )

        if workload >= 520:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "MEDIUM",
                    "title": "Elevação brusca de carga",
                    "reason": f"Carga de {workload:.0f} acima da faixa operacional esperada para o microciclo.",
                    "recommendation": "Controlar volume no treino seguinte e observar resposta subjetiva.",
                    "category": "load-spike",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"workload": workload},
                }
            )

        if sleep_hours <= 5.9:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "MEDIUM",
                    "title": "Piora do sono",
                    "reason": f"Atleta fechou a última janela com apenas {sleep_hours:.1f}h de sono.",
                    "recommendation": "Ajustar recuperação e monitorar prontidão antes de alta intensidade.",
                    "category": "recovery",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"sleepHours": sleep_hours},
                }
            )

        if soreness >= 7.2:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "MEDIUM",
                    "title": "Aumento de dor muscular",
                    "reason": f"Dor muscular subjetiva em {soreness:.1f}/10 na última sessão.",
                    "recommendation": "Preservar acelerações máximas e reavaliar antes do jogo.",
                    "category": "muscle-soreness",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"sorenessLevel": soreness},
                }
            )

        if athlete["availability_status"] == "RETURN_TO_PLAY":
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "MEDIUM",
                    "title": "Atleta em retorno controlado",
                    "reason": "A condição atual ainda exige progressão de volume e minutos.",
                    "recommendation": "Usar de forma progressiva e evitar exposição máxima contínua.",
                    "category": "return-to-play",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"status": athlete["availability_status"]},
                }
            )

        if probability <= 0.22 and float(score["readiness_score"]) >= 78:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "LOW",
                    "title": "Atleta pronto para alta intensidade",
                    "reason": "Boa combinação de prontidão, recuperação e baixo risco atual.",
                    "recommendation": "Elegível para sessão forte ou início de jogo.",
                    "category": "readiness",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"readinessScore": score["readiness_score"]},
                }
            )

        if probability >= 0.48 and fatigue >= 6.7:
            alerts.append(
                {
                    "id": str(uuid4()),
                    "athlete_id": athlete["id"],
                    "severity": "HIGH",
                    "title": "Atleta deve ser preservado",
                    "reason": "Risco moderado/alto combinado com fadiga importante na última coleta.",
                    "recommendation": "Considerar banco, rotação ou minutagem controlada.",
                    "category": "preservation",
                    "alert_date": score["recorded_at"],
                    "metadata_json": {"fatigueLevel": fatigue},
                }
            )

    return alerts


def seed_demo_database(
    repository: PostgresRepository,
    environment: DemoEnvironment,
    profiles: list[dict[str, Any]],
    latest_scores: list[dict[str, Any]],
    match_recommendation: dict[str, Any],
) -> dict[str, Any]:
    repository.create_tables()
    repository.truncate_demo_tables()

    repository.execute_many(
        """
        INSERT INTO athletes (
          id, full_name, position, current_status, current_team, birth_date, age, availability_status
        ) VALUES (
          %(id)s, %(full_name)s, %(position)s, %(current_status)s, %(current_team)s, %(birth_date)s, %(age)s, %(availability_status)s
        )
        """,
        environment.athletes,
    )

    repository.execute_many(
        """
        INSERT INTO athlete_daily_load (
          athlete_id, recorded_at, distance_meters, sprint_count, accel_count, decel_count, workload,
          avg_heart_rate_bpm, max_heart_rate_bpm, session_minutes, perceived_effort, fatigue_level, sleep_hours,
          soreness_level, injury_risk_7d, availability_status, return_to_play_phase, session_type, is_match_day
        ) VALUES (
          %(athlete_id)s, %(recorded_at)s, %(distance_meters)s, %(sprint_count)s, %(accel_count)s, %(decel_count)s, %(workload)s,
          %(avg_heart_rate_bpm)s, %(max_heart_rate_bpm)s, %(session_minutes)s, %(perceived_effort)s, %(fatigue_level)s, %(sleep_hours)s,
          %(soreness_level)s, %(injury_risk_7d)s, %(availability_status)s, %(return_to_play_phase)s, %(session_type)s, %(is_match_day)s
        )
        """,
        environment.daily_loads,
    )

    repository.execute_many(
        """
        INSERT INTO matches (id, match_date, opponent, competition, venue, result_label, team_goals, opponent_goals)
        VALUES (%(id)s, %(match_date)s, %(opponent)s, %(competition)s, %(venue)s, %(result_label)s, %(team_goals)s, %(opponent_goals)s)
        """,
        environment.matches,
    )

    repository.execute_many(
        """
        INSERT INTO athlete_match_stats (
          id, match_id, athlete_id, minutes_played, starting, distance_meters, sprint_count, duels_won,
          passes_completed, shots, expected_influence
        ) VALUES (
          %(id)s, %(match_id)s, %(athlete_id)s, %(minutes_played)s, %(starting)s, %(distance_meters)s, %(sprint_count)s, %(duels_won)s,
          %(passes_completed)s, %(shots)s, %(expected_influence)s
        )
        """,
        environment.athlete_match_stats,
    )

    repository.execute_many(
        """
        INSERT INTO athlete_profiles (
          athlete_id, status, physical_score, technical_score, availability_score, risk_score, trend_label, summary, payload_json, generated_at
        ) VALUES (
          %(athlete_id)s, %(status)s, %(physical_score)s, %(technical_score)s, %(availability_score)s, %(risk_score)s, %(trend_label)s,
          %(summary)s, %(payload_json)s, %(generated_at)s
        )
        """,
        profiles,
    )

    repository.execute_many(
        """
        INSERT INTO athlete_risk_scores (
          id, athlete_id, recorded_at, risk_probability, risk_level, readiness_score, load_score, recovery_score, explanation, payload_json
        ) VALUES (
          %(id)s, %(athlete_id)s, %(recorded_at)s, %(risk_probability)s, %(risk_level)s, %(readiness_score)s, %(load_score)s, %(recovery_score)s,
          %(explanation)s, %(payload_json)s
        )
        """,
        [{**item, "id": str(uuid4())} for item in latest_scores],
    )

    alerts = build_alerts(latest_scores, environment.athletes, _latest_daily_loads(environment))
    repository.execute_many(
        """
        INSERT INTO athlete_alerts (
          id, athlete_id, severity, title, reason, recommendation, category, alert_date, metadata_json
        ) VALUES (
          %(id)s, %(athlete_id)s, %(severity)s, %(title)s, %(reason)s, %(recommendation)s, %(category)s, %(alert_date)s, %(metadata_json)s
        )
        """,
        alerts,
    )

    repository.execute_many(
        """
        INSERT INTO match_recommendations (
          match_id, lineup_json, bench_json, unavailable_json, watchlist_json, summary, generated_at
        ) VALUES (
          %(match_id)s, %(lineup_json)s, %(bench_json)s, %(unavailable_json)s, %(watchlist_json)s, %(summary)s, %(generated_at)s
        )
        """,
        [match_recommendation],
    )

    return {
      "athletes": len(environment.athletes),
      "dailyLoads": len(environment.daily_loads),
      "matches": len(environment.matches),
      "alerts": len(alerts),
      "profiles": len(profiles),
      "riskScores": len(latest_scores),
    }
