from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DemoSetupResponse(BaseModel):
    clubName: str
    seed: dict[str, int]
    training: dict[str, Any]
    modelPath: str


class DemoCardItem(BaseModel):
    label: str
    value: str | int | float
    helper: str
    tone: str = "neutral"


class DemoDashboardResponse(BaseModel):
    cards: list[DemoCardItem]
    weeklyLoadSeries: list[dict[str, Any]]
    riskSeries: list[dict[str, Any]]
    topRisks: list[dict[str, Any]]
    topForm: list[dict[str, Any]]
    positionDistribution: list[dict[str, Any]]
    alertSeverityDistribution: list[dict[str, Any]]
    recoveryTrend: list[dict[str, Any]]
    recentAlerts: list[dict[str, Any]]
    overloadAthletes: list[dict[str, Any]]
    mostReadyAthletes: list[dict[str, Any]]
    unavailableAthletes: list[dict[str, Any]]
    watchlistAthletes: list[dict[str, Any]]


class DemoOverviewResponse(BaseModel):
    clubName: str
    generatedAt: datetime
    squad: dict[str, Any]
    commercialStory: list[str]
    headlineMetrics: dict[str, Any]


class DemoAthleteResponse(BaseModel):
    athlete: dict[str, Any]
    latestRisk: dict[str, Any] | None
    profile: dict[str, Any] | None
    recentLoads: list[dict[str, Any]]
    recentAlerts: list[dict[str, Any]]


class DemoMatchIntelligenceResponse(BaseModel):
    match: dict[str, Any]
    recommendation: dict[str, Any]

