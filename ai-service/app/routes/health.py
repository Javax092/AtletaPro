from fastapi import APIRouter

from app.schemas.health import HealthResponse
from app.services.health_service import health_service

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> dict:
    return health_service.get_status()

