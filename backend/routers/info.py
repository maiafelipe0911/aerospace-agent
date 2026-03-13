from fastapi import APIRouter
from backend.core.engine import get_engine_status
from backend.llm import list_providers

router = APIRouter()


@router.get("/health")
def health():
    status = get_engine_status()
    is_ok = status["engine"] == "loaded"
    return {"status": "ok" if is_ok else "degraded", **status}


@router.get("/models")
def models():
    return {"providers": list_providers()}
