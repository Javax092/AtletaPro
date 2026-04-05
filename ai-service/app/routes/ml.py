from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.ml import DatasetAnalysisResponse, DatasetTrainAllRequest, TrainAllResponse
from app.services.ml_service import ml_service
from app.utils.logger import log


router = APIRouter(prefix="/ml", tags=["ml"])


@router.post("/train-all", response_model=TrainAllResponse)
def train_all(payload: DatasetTrainAllRequest) -> TrainAllResponse:
    log("info", "ml.train_all.requested", datasets=payload.datasets)
    return TrainAllResponse(**ml_service.train_all(payload.datasets))


@router.get("/dataset-analysis", response_model=DatasetAnalysisResponse)
def dataset_analysis(datasets: list[str] | None = Query(default=None)) -> DatasetAnalysisResponse:
    log("info", "ml.dataset_analysis.requested", datasets=datasets or [])
    return DatasetAnalysisResponse(**ml_service.dataset_analysis(datasets))
