"""
OpenAI adapter.

Named openai_adapter.py (not openai.py) to avoid shadowing the `openai` stdlib package.

Key protocol differences from Gemini:
- System prompt is the first message with role="system".
- Tools use {"type": "function", "function": {...}} wrapper.
- Tool calls are in response.choices[0].message.tool_calls.
- Tool results are injected as role="tool" messages keyed by tool_call_id.
- Assistant turn is appended as the ChatCompletionMessage from the response.
"""

import json
from typing import Any

import openai as openai_sdk

from backend.core.tools import SYSTEM_PROMPT
from .base import LLMProvider, ToolCall


class OpenAIProvider(LLMProvider):

    # ------------------------------------------------------------------
    # Tool translation
    # ------------------------------------------------------------------

    def translate_tools(self, tool_defs: list[dict]) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"],
                },
            }
            for tool in tool_defs
        ]

    # ------------------------------------------------------------------
    # Message construction
    # ------------------------------------------------------------------

    def build_messages(self, history: list[dict], message: str) -> list:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for entry in history:
            role = entry.get("role", "user")
            # Frontend sends "model" (Gemini convention); OpenAI expects "assistant"
            if role == "model":
                role = "assistant"
            text = entry.get("text", "")
            if text:
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": message})
        return messages

    # ------------------------------------------------------------------
    # LLM call
    # ------------------------------------------------------------------

    def generate(
        self,
        messages: list,
        tools: list[dict],
        api_key: str,
        model: str,
    ) -> Any:
        client = openai_sdk.OpenAI(api_key=api_key)
        return client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    def parse_tool_calls(self, response: Any) -> list[ToolCall]:
        message = response.choices[0].message
        if not message.tool_calls:
            return []
        return [
            ToolCall(
                name=tc.function.name,
                args=json.loads(tc.function.arguments),
                call_id=tc.id,
            )
            for tc in message.tool_calls
        ]

    def extract_text(self, response: Any) -> str:
        return response.choices[0].message.content or ""

    # ------------------------------------------------------------------
    # History mutation
    # ------------------------------------------------------------------

    def append_assistant_turn(self, messages: list, response: Any) -> None:
        # Append the ChatCompletionMessage directly; OpenAI SDK accepts it.
        messages.append(response.choices[0].message)

    def append_tool_results(
        self,
        messages: list,
        results: list[tuple[str, str, dict]],
    ) -> None:
        for _name, call_id, result in results:
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call_id,
                    "content": json.dumps(result),
                }
            )
