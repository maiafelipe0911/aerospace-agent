import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from backend.core.engine import load_engine
from backend.routers import chat, calculate, info


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_engine()
    yield


app = FastAPI(title="ARIA API", version="2.0.0", lifespan=lifespan)

origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(info.router,      prefix="/api")
app.include_router(calculate.router, prefix="/api/calculate")
app.include_router(chat.router,      prefix="/api")

# Serve frontend static files in production; redirect to /docs in dev
_frontend_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return RedirectResponse(url="/docs")
