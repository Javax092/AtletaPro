from __future__ import annotations

from statistics import mean

from app.schemas.injury_risk import (
    InjuryRiskFactor,
    InjuryRiskMetric,
    InjuryRiskRequest,
    InjuryRiskResponse,
)
from app.utils.logger import log


class InjuryRiskService:
    def analyze(self, payload: InjuryRiskRequest) -> InjuryRiskResponse:
        current = payload.currentMetric
        previous_metrics = payload.recentMetrics
        factors: list[InjuryRiskFactor] = []

        workload = current.workload or 0
        avg_hr = current.avgHeartRateBpm or 0
        minutes = current.sessionMinutes or 0
        effort = current.perceivedEffort or 0
        fatigue = current.fatigueLevel or 0
        soreness = current.sorenessLevel or 0
        sleep_hours = current.sleepHours if current.sleepHours is not None else 8
        accel_count = current.accelCount or 0
        decel_count = current.decelCount or 0

        if workload >= 430 and avg_hr >= 155:
            factors.append(
                InjuryRiskFactor(
                    code="high_load_high_hr",
                    label="Carga alta com FC elevada",
                    impact=24,
                    detail=f"Carga {workload:.0f} com FC media {avg_hr:.0f} bpm sugere estresse fisiologico acima do ideal.",
                )
            )
        elif workload >= 430:
            factors.append(
                InjuryRiskFactor(
                    code="high_load",
                    label="Carga alta",
                    impact=14,
                    detail=f"Carga {workload:.0f} acima da faixa de conforto recente.",
                )
            )

        workload_delta_factor = self._build_workload_delta_factor(current, previous_metrics)
        if workload_delta_factor is not None:
            factors.append(workload_delta_factor)

        if effort >= 7.5 and minutes >= 80:
            factors.append(
                InjuryRiskFactor(
                    code="high_effort_long_minutes",
                    label="Esforco alto por muitos minutos",
                    impact=20,
                    detail=f"Esforco percebido {effort:.1f} em {minutes:.0f} minutos aumenta a chance de sobrecarga.",
                )
            )
        elif effort >= 6.5 and minutes >= 70:
            factors.append(
                InjuryRiskFactor(
                    code="sustained_effort",
                    label="Esforco sustentado",
                    impact=10,
                    detail=f"Esforco percebido {effort:.1f} sustentado por {minutes:.0f} minutos merece monitoramento.",
                )
            )

        if fatigue >= 7:
            factors.append(
                InjuryRiskFactor(
                    code="high_fatigue",
                    label="Fadiga alta",
                    impact=12,
                    detail=f"Fadiga reportada em {fatigue:.1f}/10.",
                )
            )

        if soreness >= 7:
            factors.append(
                InjuryRiskFactor(
                    code="high_soreness",
                    label="Dor muscular alta",
                    impact=10,
                    detail=f"Dor muscular reportada em {soreness:.1f}/10.",
                )
            )

        if sleep_hours < 6.5:
            factors.append(
                InjuryRiskFactor(
                    code="low_sleep",
                    label="Recuperacao incompleta",
                    impact=8,
                    detail=f"Sono de {sleep_hours:.1f} horas reduz capacidade de recuperacao.",
                )
            )

        movement_load = accel_count + decel_count
        if movement_load >= 55:
            factors.append(
                InjuryRiskFactor(
                    code="high_movement_load",
                    label="Muitas aceleracoes e desaceleracoes",
                    impact=8,
                    detail=f"{movement_load:.0f} eventos de aceleracao/desaceleracao aumentam carga mecanica.",
                )
            )

        base_score = 12
        risk_score = max(0, min(100, round(base_score + sum(factor.impact for factor in factors), 2)))

        if risk_score >= 70:
            risk_level: str = "HIGH"
        elif risk_score >= 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        if factors:
            summary = (
                f"Risco {risk_level.lower()} por "
                + ", ".join(factor.label.lower() for factor in factors[:3])
                + "."
            )
        else:
            summary = "Risco low com sinais atuais dentro da faixa esperada."

        explanation = " ".join(factor.detail for factor in factors) if factors else (
            "Nao houve combinacao relevante de carga, frequencia cardiaca, esforco, minutos ou recuperacao."
        )

        response = InjuryRiskResponse(
            riskScore=risk_score,
            riskLevel=risk_level,
            summary=summary,
            explanation=explanation,
            factors=factors,
        )

        log(
            "info",
            "injury_risk.analyze.completed",
            clubId=payload.clubId,
            athleteId=payload.athleteId,
            metricId=payload.metricId,
            riskLevel=response.riskLevel,
            riskScore=response.riskScore,
        )

        return response

    def _build_workload_delta_factor(
        self,
        current: InjuryRiskMetric,
        previous_metrics: list[InjuryRiskMetric],
    ) -> InjuryRiskFactor | None:
        current_workload = current.workload
        if current_workload is None:
            return None

        historic_workloads = [item.workload for item in previous_metrics if item.workload is not None]
        if not historic_workloads:
            return None

        baseline = mean(historic_workloads)
        if baseline <= 0:
            return None

        delta_ratio = current_workload / baseline
        delta_percent = ((current_workload - baseline) / baseline) * 100

        if delta_ratio >= 1.35:
            impact = 22
            label = "Aumento brusco de carga"
        elif delta_ratio >= 1.2:
            impact = 12
            label = "Carga acima da media recente"
        else:
            return None

        return InjuryRiskFactor(
            code="workload_spike",
            label=label,
            impact=impact,
            detail=(
                f"Carga atual {current_workload:.0f} esta {delta_percent:.0f}% acima da media recente "
                f"de {baseline:.0f}."
            ),
        )


injury_risk_service = InjuryRiskService()
