from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app.ml.train_multi_dataset import get_dataset_analysis, train_multi_dataset
from app.utils.logger import log


class MLService:
    def train_all(self, datasets: list[str]) -> dict[str, Any]:
        try:
            result = train_multi_dataset(datasets)
        except (FileNotFoundError, ValueError) as error:
            log("error", "ml.train_all.failed", message=str(error), datasets=datasets)
            raise HTTPException(status_code=400, detail=str(error)) from error

        return result

    def dataset_analysis(self, datasets: list[str] | None = None) -> dict[str, Any]:
        try:
            result = get_dataset_analysis(datasets)
        except FileNotFoundError as error:
            log("error", "ml.dataset_analysis.not_found", message=str(error), datasets=datasets or [])
            raise HTTPException(status_code=404, detail=str(error)) from error
        except ValueError as error:
            log("error", "ml.dataset_analysis.invalid", message=str(error), datasets=datasets or [])
            raise HTTPException(status_code=400, detail=str(error)) from error

        return result


ml_service = MLService()
