from __future__ import annotations

from datetime import datetime, UTC
from typing import Any

from fastapi import HTTPException

from app.db.postgres_repository import PostgresRepository
from app.demo.setup_demo import run_setup_demo
from app.schemas.demo import DemoDashboardResponse, DemoOverviewResponse
from app.utils.settings import settings


class DemoService:
    def __init__(self) -> None:
        self.repository = PostgresRepository(settings.demo_database_url)

    def setup(self) -> dict[str, Any]:
        return run_setup_demo()

    def train(self) -> dict[str, Any]:
        return run_setup_demo()["training"]

    def _require_rows(self, rows: list[dict[str, Any]], message: str) -> list[dict[str, Any]]:
        if not rows:
            raise HTTPException(status_code=404, detail=message)
        return rows

    def overview(self) -> DemoOverviewResponse:
        athletes = self.repository.fetch_all("SELECT * FROM athletes ORDER BY position, full_name")
        alerts = self.repository.fetch_all("SELECT * FROM athlete_alerts ORDER BY alert_date DESC LIMIT 50")
        risks = self.repository.fetch_all("SELECT * FROM athlete_risk_scores ORDER BY recorded_at DESC")
        self._require_rows(athletes, "Demo environment not initialized")

        available = sum(1 for athlete in athletes if athlete["availability_status"] == "AVAILABLE")
        monitoring = sum(1 for athlete in athletes if athlete["availability_status"] == "MONITORING")
        returning = sum(1 for athlete in athletes if athlete["availability_status"] == "RETURN_TO_PLAY")
        unavailable = sum(1 for athlete in athletes if athlete["availability_status"] == "UNAVAILABLE")
        high_risks = sum(1 for risk in risks if risk["risk_level"] == "HIGH")

        return DemoOverviewResponse(
            clubName=settings.demo_club_name,
            generatedAt=datetime.now(UTC),
            squad={
                "monitoredAthletes": len(athletes),
                "available": available,
                "monitoring": monitoring,
                "returning": returning,
                "unavailable": unavailable,
            },
            commercialStory=[
                "Você sabe quem está pronto para competir hoje.",
                "Você identifica rapidamente atletas que precisam ser preservados.",
                "Você mostra disponibilidade do elenco com linguagem clara para comissão e gestão.",
            ],
            headlineMetrics={
                "highRiskAthletes": high_risks,
                "criticalAlerts": sum(1 for alert in alerts if alert["severity"] == "HIGH"),
                "availabilityRate": round((available / max(len(athletes), 1)) * 100, 1),
            },
        )

    def dashboard(self) -> DemoDashboardResponse:
        athletes = self.repository.fetch_all("SELECT * FROM athletes ORDER BY full_name")
        risks = self.repository.fetch_all(
            """
            SELECT r.*, a.full_name, a.position, a.availability_status
            FROM athlete_risk_scores r
            JOIN athletes a ON a.id = r.athlete_id
            ORDER BY r.recorded_at DESC
            """
        )
        alerts = self.repository.fetch_all(
            """
            SELECT al.*, a.full_name, a.position
            FROM athlete_alerts al
            JOIN athletes a ON a.id = al.athlete_id
            ORDER BY al.alert_date DESC
            LIMIT 100
            """
        )
        daily = self.repository.fetch_all(
            """
            SELECT athlete_id, recorded_at::date AS day, AVG(workload) AS avg_workload, AVG(fatigue_level) AS avg_fatigue
            FROM athlete_daily_load
            GROUP BY athlete_id, day
            ORDER BY day
            """
        )
        profiles = self.repository.fetch_all(
            """
            SELECT p.*, a.full_name, a.position, a.availability_status
            FROM athlete_profiles p
            JOIN athletes a ON a.id = p.athlete_id
            ORDER BY p.physical_score DESC
            """
        )
        self._require_rows(athletes, "Demo environment not initialized")

        latest_risk_map: dict[str, dict[str, Any]] = {}
        for risk in risks:
            latest_risk_map.setdefault(risk["athlete_id"], risk)

        weekly_group: dict[str, dict[str, float]] = {}
        for row in daily[-7 * len(athletes):]:
            key = str(row["day"])
            item = weekly_group.setdefault(key, {"workload": 0.0, "fatigue": 0.0, "count": 0.0})
            item["workload"] += float(row["avg_workload"])
            item["fatigue"] += float(row["avg_fatigue"])
            item["count"] += 1

        weekly_load_series = [
            {
                "date": key,
                "avgWorkload": round(value["workload"] / max(value["count"], 1), 1),
                "avgFatigue": round(value["fatigue"] / max(value["count"], 1), 1),
            }
            for key, value in sorted(weekly_group.items())
        ]

        position_distribution: dict[str, int] = {}
        for athlete in athletes:
            position_distribution[athlete["position"]] = position_distribution.get(athlete["position"], 0) + 1

        alert_severity_distribution: dict[str, int] = {}
        for alert in alerts:
            alert_severity_distribution[alert["severity"]] = alert_severity_distribution.get(alert["severity"], 0) + 1

        top_risks = sorted(latest_risk_map.values(), key=lambda item: item["risk_probability"], reverse=True)[:5]
        top_form = sorted(profiles, key=lambda item: item["physical_score"], reverse=True)[:5]
        unavailable_athletes = [athlete for athlete in athletes if athlete["availability_status"] == "UNAVAILABLE"][:8]
        watchlist = [risk for risk in latest_risk_map.values() if risk["risk_level"] != "LOW"][:8]
        overload = sorted(
            [risk for risk in latest_risk_map.values() if float(risk["load_score"]) <= 58],
            key=lambda item: item["load_score"],
        )[:8]
        ready = sorted(latest_risk_map.values(), key=lambda item: item["readiness_score"], reverse=True)[:8]

        cards = [
            {"label": "Atletas monitorados", "value": len(athletes), "helper": "Elenco completo pronto para apresentação", "tone": "info"},
            {"label": "Atletas de alto risco", "value": sum(1 for item in latest_risk_map.values() if item["risk_level"] == "HIGH"), "helper": "Prioridades imediatas da comissão", "tone": "danger"},
            {"label": "Disponibilidade do elenco", "value": f"{round(sum(1 for athlete in athletes if athlete['availability_status'] == 'AVAILABLE') / max(len(athletes), 1) * 100)}%", "helper": "Percentual disponível hoje", "tone": "success"},
            {"label": "Carga média da semana", "value": round(sum(item["avgWorkload"] for item in weekly_load_series[-7:]) / max(len(weekly_load_series[-7:]), 1), 1) if weekly_load_series else 0, "helper": "Volume recente consolidado", "tone": "warning"},
            {"label": "Atletas em retorno", "value": sum(1 for athlete in athletes if athlete["availability_status"] == "RETURN_TO_PLAY"), "helper": "Requerem progressão controlada", "tone": "warning"},
            {"label": "Prontos para jogar", "value": sum(1 for item in latest_risk_map.values() if item["readiness_score"] >= 78 and item["risk_level"] == "LOW"), "helper": "Prontidão competitiva alta", "tone": "success"},
            {"label": "Alertas críticos", "value": sum(1 for alert in alerts if alert["severity"] == "HIGH"), "helper": "Itens com ação imediata", "tone": "danger"},
            {"label": "Variação de risco semanal", "value": round((weekly_load_series[-1]["avgFatigue"] - weekly_load_series[0]["avgFatigue"]), 1) if len(weekly_load_series) >= 2 else 0, "helper": "Mudança recente da recuperação", "tone": "info"},
        ]

        return DemoDashboardResponse(
            cards=cards,
            weeklyLoadSeries=weekly_load_series,
            riskSeries=[
                {"athleteId": item["athlete_id"], "athleteName": item["full_name"], "riskProbability": item["risk_probability"], "riskLevel": item["risk_level"]}
                for item in top_risks
            ],
            topRisks=top_risks,
            topForm=top_form,
            positionDistribution=[{"position": key, "count": value} for key, value in position_distribution.items()],
            alertSeverityDistribution=[{"severity": key, "count": value} for key, value in alert_severity_distribution.items()],
            recoveryTrend=weekly_load_series,
            recentAlerts=alerts[:10],
            overloadAthletes=overload,
            mostReadyAthletes=ready,
            unavailableAthletes=unavailable_athletes,
            watchlistAthletes=watchlist,
        )

    def athletes(self) -> list[dict[str, Any]]:
        return self.repository.fetch_all(
            """
            SELECT a.*, p.physical_score, p.technical_score, p.availability_score, p.risk_score, p.summary,
                   r.risk_probability, r.risk_level, r.readiness_score
            FROM athletes a
            LEFT JOIN athlete_profiles p ON p.athlete_id = a.id
            LEFT JOIN LATERAL (
              SELECT *
              FROM athlete_risk_scores r
              WHERE r.athlete_id = a.id
              ORDER BY r.recorded_at DESC
              LIMIT 1
            ) r ON true
            ORDER BY a.position, a.full_name
            """
        )

    def athlete_detail(self, athlete_id: str) -> dict[str, Any]:
        athlete = self.repository.fetch_one("SELECT * FROM athletes WHERE id = %s", (athlete_id,))
        if not athlete:
            raise HTTPException(status_code=404, detail="Athlete not found in demo environment")

        profile = self.repository.fetch_one("SELECT * FROM athlete_profiles WHERE athlete_id = %s", (athlete_id,))
        latest_risk = self.repository.fetch_one(
            "SELECT * FROM athlete_risk_scores WHERE athlete_id = %s ORDER BY recorded_at DESC LIMIT 1",
            (athlete_id,),
        )
        recent_loads = self.repository.fetch_all(
            """
            SELECT *
            FROM athlete_daily_load
            WHERE athlete_id = %s
            ORDER BY recorded_at DESC
            LIMIT 14
            """,
            (athlete_id,),
        )
        recent_alerts = self.repository.fetch_all(
            """
            SELECT *
            FROM athlete_alerts
            WHERE athlete_id = %s
            ORDER BY alert_date DESC
            LIMIT 10
            """,
            (athlete_id,),
        )
        return {
            "athlete": athlete,
            "latestRisk": latest_risk,
            "profile": profile,
            "recentLoads": recent_loads,
            "recentAlerts": recent_alerts,
        }

    def alerts(self) -> list[dict[str, Any]]:
        return self.repository.fetch_all(
            """
            SELECT al.*, a.full_name, a.position
            FROM athlete_alerts al
            JOIN athletes a ON a.id = al.athlete_id
            ORDER BY al.alert_date DESC
            """
        )

    def match_intelligence(self) -> dict[str, Any]:
        match = self.repository.fetch_one("SELECT * FROM matches ORDER BY match_date DESC LIMIT 1")
        recommendation = self.repository.fetch_one("SELECT * FROM match_recommendations WHERE match_id = %s", (match["id"],)) if match else None
        if not match or not recommendation:
            raise HTTPException(status_code=404, detail="Match intelligence not prepared for demo environment")
        return {"match": match, "recommendation": recommendation}

    def readiness(self) -> list[dict[str, Any]]:
        return self.repository.fetch_all(
            """
            SELECT r.*, a.full_name, a.position
            FROM athlete_risk_scores r
            JOIN athletes a ON a.id = r.athlete_id
            ORDER BY r.readiness_score DESC
            LIMIT 20
            """
        )

    def top_risks(self) -> list[dict[str, Any]]:
        return self.repository.fetch_all(
            """
            SELECT r.*, a.full_name, a.position
            FROM athlete_risk_scores r
            JOIN athletes a ON a.id = r.athlete_id
            ORDER BY r.risk_probability DESC
            LIMIT 10
            """
        )


demo_service = DemoService()
