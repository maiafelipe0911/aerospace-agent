"""
Groq adapter — OpenAI-compatible API with Groq's base URL.

Groq provides free-tier access to models like DeepSeek R1 and Llama
with generous rate limits. Uses the OpenAI SDK pointed at Groq's endpoint.

Key differences from standard OpenAI:
- base_url is https://api.groq.com/openai/v1
- API keys start with "gsk_"
- Model IDs are Groq-specific (e.g. "deepseek-r1-distill-llama-70b")
"""

import json
from typing import Any

import openai as openai_sdk

from backend.core.tools import SYSTEM_PROMPT
from .base import LLMProvider, ToolCall


GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class GroqProvider(LLMProvider):

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
            # Frontend sends "model" (Gemini convention); Groq expects "assistant"
            if role == "model":
                role = "assistant"
            text = entry.get("text", "")
            if text:
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": message})
        return messages

    # ------------------------------------------------------------------
    # LLM call — OpenAI SDK with Groq base URL
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
            base_url=GROQ_BASE_URL,
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
