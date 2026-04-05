from fastapi import APIRouter

from app.schemas.injury_risk import InjuryRiskRequest, InjuryRiskResponse
from app.services.injury_risk_service import injury_risk_service
from app.utils.logger import log

router = APIRouter(prefix="/api/injury-risk", tags=["injury-risk"])


@router.post("/analyze", response_model=InjuryRiskResponse)
def analyze_injury_risk(payload: InjuryRiskRequest) -> InjuryRiskResponse:
    log(
        "info",
        "injury_risk.analyze.request",
        clubId=payload.clubId,
        athleteId=payload.athleteId,
        metricId=payload.metricId,
        recentMetricsCount=len(payload.recentMetrics),
    )
    return injury_risk_service.analyze(payload)
