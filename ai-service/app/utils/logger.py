import contextvars
import json
from datetime import datetime, timezone
from typing import Any


request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)


def set_request_id(request_id: str | None) -> None:
    request_id_var.set(request_id)


def get_request_id() -> str | None:
    return request_id_var.get()


def log(level: str, event: str, **context: Any) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "service": "ai-service",
        "event": event,
        "requestId": get_request_id(),
        **context,
    }
    print(json.dumps(entry, ensure_ascii=True, default=str))
