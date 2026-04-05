from typing import Literal

from pydantic import BaseModel, Field


class InjuryRiskMetric(BaseModel):
    recordedAt: str
    distanceMeters: float | None = None
    sprintCount: int | None = None
    accelCount: int | None = None
    decelCount: int | None = None
    workload: float | None = None
    avgHeartRateBpm: float | None = None
    maxHeartRateBpm: float | None = None
    sessionMinutes: float | None = None
    perceivedEffort: float | None = None
    fatigueLevel: float | None = None
    sleepHours: float | None = None
    sorenessLevel: float | None = None


class InjuryRiskRequest(BaseModel):
    clubId: str
    athleteId: str
    metricId: str
    currentMetric: InjuryRiskMetric
    recentMetrics: list[InjuryRiskMetric] = Field(default_factory=list)


class InjuryRiskFactor(BaseModel):
    code: str
    label: str
    impact: float
    detail: str


class InjuryRiskResponse(BaseModel):
    riskScore: float
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    summary: str
    explanation: str
    factors: list[InjuryRiskFactor] = Field(default_factory=list)
