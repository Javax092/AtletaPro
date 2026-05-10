from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

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
        set_request_id(None)
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
    set_request_id(None)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, error: RequestValidationError):
    issues = [
        {
            "path": ".".join(str(item) for item in issue["loc"]),
            "message": issue["msg"],
        }
        for issue in error.errors()
    ]

    log(
        "warn",
        "request.validation_failed",
        method=request.method,
        path=request.url.path,
        issues=issues,
    )
    return JSONResponse(status_code=422, content={"message": "Invalid request payload", "issues": issues})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, error: HTTPException):
    log(
        "warn",
        "request.http_error",
        method=request.method,
        path=request.url.path,
        statusCode=error.status_code,
        detail=error.detail,
    )
    return JSONResponse(status_code=error.status_code, content={"message": error.detail})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, error: Exception):
    log(
        "error",
        "request.unhandled_error",
        method=request.method,
        path=request.url.path,
        message=str(error),
    )
    return JSONResponse(status_code=500, content={"message": "Internal server error"})

app.include_router(health_router)
app.include_router(demo_router)
app.include_router(injury_risk_router)
app.include_router(ml_router)
app.include_router(video_router)

log(
    "info",
    "app.boot.ready",
    environment=settings.environment,
    port=settings.port,
    storageDir=settings.storage_dir,
)
