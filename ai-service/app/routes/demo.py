from __future__ import annotations

from fastapi import APIRouter

from app.schemas.demo import DemoAthleteResponse, DemoDashboardResponse, DemoMatchIntelligenceResponse, DemoOverviewResponse, DemoSetupResponse
from app.services.demo_service import demo_service


router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/setup", response_model=DemoSetupResponse)
def setup_demo() -> DemoSetupResponse:
    return DemoSetupResponse(**demo_service.setup())


@router.post("/train")
def train_demo():
    return demo_service.train()


@router.get("/dashboard", response_model=DemoDashboardResponse)
def demo_dashboard() -> DemoDashboardResponse:
    return demo_service.dashboard()


@router.get("/overview", response_model=DemoOverviewResponse)
def demo_overview() -> DemoOverviewResponse:
    return demo_service.overview()


@router.get("/athletes")
def demo_athletes():
    return demo_service.athletes()


@router.get("/athletes/{athlete_id}", response_model=DemoAthleteResponse)
def demo_athlete_detail(athlete_id: str) -> DemoAthleteResponse:
    return DemoAthleteResponse(**demo_service.athlete_detail(athlete_id))


@router.get("/athletes/{athlete_id}/profile")
def demo_athlete_profile(athlete_id: str):
    detail = demo_service.athlete_detail(athlete_id)
    return detail["profile"]


@router.get("/athletes/{athlete_id}/injury-risk")
def demo_athlete_injury_risk(athlete_id: str):
    detail = demo_service.athlete_detail(athlete_id)
    return detail["latestRisk"]


@router.get("/alerts")
def demo_alerts():
    return demo_service.alerts()


@router.get("/match-intelligence", response_model=DemoMatchIntelligenceResponse)
def demo_match_intelligence() -> DemoMatchIntelligenceResponse:
    return DemoMatchIntelligenceResponse(**demo_service.match_intelligence())


@router.get("/readiness")
def demo_readiness():
    return demo_service.readiness()


@router.get("/top-risks")
def demo_top_risks():
    return demo_service.top_risks()
