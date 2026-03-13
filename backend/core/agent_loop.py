"""
Async agentic loop — provider-agnostic multi-turn tool-calling loop.

Drives any LLMProvider adapter through the same control flow:
  1. Translate tools and build the initial message list.
  2. Call the model.
  3. If the model wants to call tools, dispatch them and feed results back.
  4. Repeat up to max_tool_rounds times.
  5. Emit the final text response.

Event types pushed to the queue:
  {"type": "status",      "content": str}     — human-readable status before tool dispatch
  {"type": "tool_call",   "tool": str, "args": dict}
  {"type": "tool_result", "tool": str, "result": dict}
  {"type": "text",        "content": str}
  {"type": "error",       "detail": str}
  {"type": "done"}
"""

import asyncio

from backend.llm import get_provider
from .tools import TOOL_DEFINITIONS, TOOL_STATUS_MESSAGES, dispatch_tool
from .key_validation import validate_key_format, classify_auth_error, InvalidKeyFormatError


async def run_agentic_loop(
    message: str,
    history: list[dict],
    api_key: str,
    model: str,
    provider_id: str,
    queue: asyncio.Queue,
    engine,
) -> None:
    """
    Runs the full agentic loop for one user turn.
    Puts event dicts into `queue`; always puts {"type": "done"} last.
    """
    try:
        provider = get_provider(provider_id)
    except ValueError as e:
        await queue.put({"type": "error", "detail": str(e)})
        await queue.put({"type": "done"})
        return

    # Validate key format before making any LLM calls
    try:
        validate_key_format(api_key, provider_id)
    except InvalidKeyFormatError as e:
        await queue.put({"type": "error", "detail": str(e), "is_auth": True})
        await queue.put({"type": "done"})
        return

    try:
        tools = provider.translate_tools(TOOL_DEFINITIONS)
        messages = provider.build_messages(history, message)

        max_tool_rounds = 5
        response = None

        for _tool_round in range(max_tool_rounds + 1):
            # Call the model (blocking — offloaded to thread pool)
            try:
                response = await asyncio.to_thread(
                    provider.generate, messages, tools, api_key, model
                )
            except Exception as gen_exc:
                classified = classify_auth_error(gen_exc, provider_id)
                await queue.put({"type": "error", "detail": classified["detail"], "is_auth": classified["is_auth"]})
                return

            tool_calls = provider.parse_tool_calls(response)

            if not tool_calls:
                break  # Model wants to speak — exit loop

            # Append the model's tool-request turn before dispatching
            provider.append_assistant_turn(messages, response)

            results: list[tuple[str, str, dict]] = []
            for tc in tool_calls:
                status_msg = TOOL_STATUS_MESSAGES.get(tc.name, f"Running {tc.name}...")
                await queue.put({"type": "status", "content": status_msg})
                await queue.put({"type": "tool_call", "tool": tc.name, "args": tc.args})

                result = await asyncio.to_thread(dispatch_tool, tc.name, tc.args, engine)

                await queue.put({"type": "tool_result", "tool": tc.name, "result": result})
                results.append((tc.name, tc.call_id, result))

            provider.append_tool_results(messages, results)

        if response is None:
            await queue.put({"type": "error", "detail": "Model returned no response."})
            return

        final_text = provider.extract_text(response)
        if final_text:
            await queue.put({"type": "text", "content": final_text})
        else:
            await queue.put({"type": "error", "detail": "Model produced no text response."})

    except Exception as e:
        await queue.put({"type": "error", "detail": str(e)})
    finally:
        await queue.put({"type": "done"})
