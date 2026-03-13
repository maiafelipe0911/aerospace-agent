"""
OpenRouter adapter — OpenAI-compatible API with OpenRouter's base URL.

OpenRouter aggregates many models (including free ones) behind a single API.
Uses the OpenAI SDK pointed at OpenRouter's endpoint.

Key differences from standard OpenAI:
- base_url is https://openrouter.ai/api/v1
- API keys start with "sk-or-"
- Extra HTTP headers recommended (HTTP-Referer, X-Title) for ranking/attribution
- Model IDs use "provider/model" format (e.g. "google/gemini-2.0-flash-exp:free")
"""

import json
from typing import Any

import openai as openai_sdk

from backend.core.tools import SYSTEM_PROMPT
from .base import LLMProvider, ToolCall


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class OpenRouterProvider(LLMProvider):

    # ------------------------------------------------------------------
    # Tool translation (identical to OpenAI)
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
    # Message construction (identical to OpenAI)
    # ------------------------------------------------------------------

    def build_messages(self, history: list[dict], message: str) -> list:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for entry in history:
            role = entry.get("role", "user")
            # Frontend sends "model" (Gemini convention); OpenRouter expects "assistant"
            if role == "model":
                role = "assistant"
            text = entry.get("text", "")
            if text:
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": message})
        return messages

    # ------------------------------------------------------------------
    # LLM call — OpenAI SDK with OpenRouter base URL
    # ------------------------------------------------------------------

    def generate(
        self,
        messages: list,
        tools: list[dict],
        api_key: str,
        model: str,
    ) -> Any:
        client = openai_sdk.OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL,
            default_headers={
                "HTTP-Referer": "https://github.com/aria-aerospace",
                "X-Title": "ARIA - Aerospace Reasoning & Intelligence Agent",
            },
        )
        return client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

    # ------------------------------------------------------------------
    # Response parsing (identical to OpenAI)
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
    # History mutation (identical to OpenAI)
    # ------------------------------------------------------------------

    def append_assistant_turn(self, messages: list, response: Any) -> None:
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
