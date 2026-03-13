"""
Anthropic Claude adapter.

Key protocol differences from Gemini:
- System prompt is a separate `system=` kwarg, NOT a message in the list.
- Tools use `input_schema` instead of `parameters`.
- Tool calls are content blocks with type="tool_use".
- Tool results are injected as role="user" with type="tool_result" blocks,
  keyed by `tool_use_id` (not tool name).
- Assistant turn is appended as {"role": "assistant", "content": response.content}.
"""

import json
from typing import Any

import anthropic

from backend.core.tools import SYSTEM_PROMPT
from .base import LLMProvider, ToolCall


class ClaudeProvider(LLMProvider):

    # ------------------------------------------------------------------
    # Tool translation
    # ------------------------------------------------------------------

    def translate_tools(self, tool_defs: list[dict]) -> list[dict]:
        tools = []
        for tool in tool_defs:
            tools.append(
                {
                    "name": tool["name"],
                    "description": tool["description"],
                    "input_schema": tool["parameters"],
                }
            )
        return tools

    # ------------------------------------------------------------------
    # Message construction
    # ------------------------------------------------------------------

    def build_messages(self, history: list[dict], message: str) -> list:
        messages = []
        for entry in history:
            role = entry.get("role", "user")
            # Frontend sends "model" (Gemini convention); Claude expects "assistant"
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
        client = anthropic.Anthropic(api_key=api_key)
        return client.messages.create(
            model=model,
            max_tokens=8096,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    def parse_tool_calls(self, response: Any) -> list[ToolCall]:
        return [
            ToolCall(
                name=block.name,
                args=dict(block.input),
                call_id=block.id,
            )
            for block in response.content
            if block.type == "tool_use"
        ]

    def extract_text(self, response: Any) -> str:
        parts = [block.text for block in response.content if block.type == "text"]
        return "\n".join(parts)

    # ------------------------------------------------------------------
    # History mutation
    # ------------------------------------------------------------------

    def append_assistant_turn(self, messages: list, response: Any) -> None:
        # response.content is a list of TextBlock / ToolUseBlock objects.
        # Anthropic SDK accepts them directly as the assistant turn content.
        messages.append({"role": "assistant", "content": response.content})

    def append_tool_results(
        self,
        messages: list,
        results: list[tuple[str, str, dict]],
    ) -> None:
        tool_result_blocks = [
            {
                "type": "tool_result",
                "tool_use_id": call_id,
                "content": json.dumps(result),
            }
            for _name, call_id, result in results
        ]
        messages.append({"role": "user", "content": tool_result_blocks})
