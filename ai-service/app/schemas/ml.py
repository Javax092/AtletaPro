from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DatasetTrainAllRequest(BaseModel):
    datasets: list[str] = Field(min_length=1)


class RiskDistributionResponse(BaseModel):
    baixo_risco: int = Field(alias="Baixo risco")
    risco_moderado: int = Field(alias="Risco moderado")
    alto_risco: int = Field(alias="Alto risco")

    model_config = {"populate_by_name": True}


class TopRiskAthleteResponse(BaseModel):
    athlete_id: str
    dataset_type: str
    records: int
    average_workload: float
    average_fatigue: float
    average_injury_risk: float
    max_injury_risk: float
    risk_label: str
    latest_recorded_at: str


class DatasetStatsResponse(BaseModel):
    rows: int
    athletes: int
    average_workload: float
    average_fatigue_level: float
    average_injury_risk: float
    risk_distribution: RiskDistributionResponse
    top_risk_athletes: list[TopRiskAthleteResponse] = Field(default_factory=list)


class ComparisonVisualItemResponse(BaseModel):
    dataset_type: str
    risk_label: str
    average_risk: float
    average_workload: float
    average_fatigue_level: float
    rows: int


class DashboardPayloadResponse(BaseModel):
    risk_average_by_dataset: dict[str, float]
    top_risk_athletes: list[TopRiskAthleteResponse] = Field(default_factory=list)
    comparison_visual: list[ComparisonVisualItemResponse] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)


class ModelMetricsResponse(BaseModel):
    accuracy: float
    f1_score: float
    roc_auc: float | None = None


class TrainAllResponse(BaseModel):
    metrics: ModelMetricsResponse
    rows_total: int
    rows_trained: int
    rows_tested: int
    feature_columns: list[str]
    dataset_distribution: dict[str, DatasetStatsResponse]
    scenario_predictions: dict[str, float]
    dashboard_payload: DashboardPayloadResponse
    model_path: str
    dataset_paths: list[str]
    trained_at: str


class DatasetAnalysisResponse(BaseModel):
    dataset_distribution: dict[str, DatasetStatsResponse]
    dashboard_payload: DashboardPayloadResponse
    top_risk_athletes: list[TopRiskAthleteResponse] = Field(default_factory=list)
    scenario_predictions: dict[str, float] = Field(default_factory=dict)
    dataset_paths: list[str] = Field(default_factory=list)
    trained_at: str | None = None
    model_path: str | None = None


class TrainAllErrorResponse(BaseModel):
    detail: str
    context: dict[str, Any] = Field(default_factory=dict)
