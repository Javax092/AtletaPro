from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request

from app.routes.health import router as health_router
from app.routes.demo import router as demo_router
from app.routes.injury_risk import router as injury_risk_router
from app.routes.ml import router as ml_router
from app.routes.video import router as video_router
from app.utils.logger import log, set_request_id
from app.utils.settings import settings

app = FastAPI(title="Sports AI Service", version="0.1.0")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started_at = perf_counter()
    set_request_id(request_id)

    log("info", "request.started", method=request.method, path=request.url.path)

    try:
        response = await call_next(request)
    except Exception as error:
        log(
            "error",
            "request.failed",
            method=request.method,
            path=request.url.path,
            durationMs=round((perf_counter() - started_at) * 1000, 2),
            message=str(error),
        )
        raise

    response.headers["x-request-id"] = request_id
    log(
        "info",
        "request.completed",
        method=request.method,
        path=request.url.path,
        statusCode=response.status_code,
        durationMs=round((perf_counter() - started_at) * 1000, 2),
    )
    return response

app.include_router(health_router)
app.include_router(demo_router)
app.include_router(injury_risk_router)
app.include_router(ml_router)
app.include_router(video_router)

log(
    "info",
    "app.boot.ready",
    appEnv=settings.app_env,
    port=settings.app_port,
    storageDir=settings.storage_dir,
)
