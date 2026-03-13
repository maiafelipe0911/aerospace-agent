import asyncio
import json

from fastapi import APIRouter, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.core.engine import get_engine
from backend.core.agent_loop import run_agentic_loop

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    model: str = "gemini-2.5-flash"
    provider: str = "gemini"


# ---------------------------------------------------------------------------
# SSE helpers
# ---------------------------------------------------------------------------

def _sse_line(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def _stream_events(
    message: str,
    history: list[dict],
    api_key: str,
    model: str,
    provider: str,
    engine,
):
    queue: asyncio.Queue = asyncio.Queue()
    task = asyncio.create_task(
        run_agentic_loop(message, history, api_key, model, provider, queue, engine)
    )
    try:
        while True:
            event = await queue.get()
            yield _sse_line(event)
            if event["type"] == "done":
                break
    finally:
        task.cancel()


# ---------------------------------------------------------------------------
# POST /api/chat  — SSE streaming
# ---------------------------------------------------------------------------

@router.post("/chat")
async def chat(request: ChatRequest, x_api_key: str | None = Header(default=None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header.")

    engine = get_engine()

    return StreamingResponse(
        _stream_events(
            request.message,
            request.history,
            x_api_key,
            request.model,
            request.provider,
            engine,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# WebSocket /ws/chat
# ---------------------------------------------------------------------------

@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        raw = await websocket.receive_text()
        data = json.loads(raw)

        api_key = data.get("api_key", "")
        if not api_key:
            await websocket.send_json({"type": "error", "detail": "Missing api_key field."})
            await websocket.close()
            return

        message = data.get("message", "")
        history = data.get("history", [])
        model = data.get("model", "gemini-2.5-flash")
        provider = data.get("provider", "gemini")

        engine = get_engine()
        queue: asyncio.Queue = asyncio.Queue()
        task = asyncio.create_task(
            run_agentic_loop(message, history, api_key, model, provider, queue, engine)
        )

        try:
            while True:
                event = await queue.get()
                await websocket.send_json(event)
                if event["type"] == "done":
                    break
        finally:
            task.cancel()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "detail": str(e)})
        except Exception:
            pass
