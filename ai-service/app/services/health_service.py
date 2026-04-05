from app.utils.settings import settings


class HealthService:
    def get_status(self) -> dict:
        return {
            "status": "ok",
            "service": "ai-service",
            "environment": settings.app_env,
        }


health_service = HealthService()

