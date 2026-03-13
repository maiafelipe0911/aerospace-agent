"""
Google Gemini adapter.

Ports the Gemini-specific logic that was previously spread across
tools.build_gemini_config() and agent_loop._history_to_gemini().
"""

from typing import Any

from google import genai
from google.genai import types

from backend.core.tools import SYSTEM_PROMPT
from .base import LLMProvider, ToolCall


class GeminiProvider(LLMProvider):

    # ------------------------------------------------------------------
    # Tool translation
    # ------------------------------------------------------------------

    def translate_tools(self, tool_defs: list[dict]) -> types.GenerateContentConfig:
        declarations = []
        for tool in tool_defs:
            props = {}
            for pname, pdef in tool["parameters"]["properties"].items():
                props[pname] = types.Schema(
                    type=types.Type.NUMBER,
                    description=pdef["description"],
                )
            declarations.append(
                types.FunctionDeclaration(
                    name=tool["name"],
                    description=tool["description"],
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties=props,
                        required=tool["parameters"]["required"],
                    ),
                )
            )

        return types.GenerateContentConfig(
            tools=[types.Tool(function_declarations=declarations)],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
            tool_config=types.ToolConfig(
                function_calling_config=types.FunctionCallingConfig(mode="AUTO")
            ),
            system_instruction=SYSTEM_PROMPT,
        )

    # ------------------------------------------------------------------
    # Message construction
    # ------------------------------------------------------------------

    def build_messages(self, history: list[dict], message: str) -> list:
        contents = []
        for entry in history:
            role = entry.get("role", "user")
            text = entry.get("text", "")
            if text:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text)],
                    )
                )
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)],
            )
        )
        return contents

    # ------------------------------------------------------------------
    # LLM call
    # ------------------------------------------------------------------

    def generate(
        self,
        messages: list,
        tools: types.GenerateContentConfig,
        api_key: str,
        model: str,
    ) -> Any:
        client = genai.Client(api_key=api_key)
        return client.models.generate_content(
            model=model,
            contents=messages,
            config=tools,
        )

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    def parse_tool_calls(self, response: Any) -> list[ToolCall]:
        candidate = response.candidates[0]
        if candidate.content is None:
            return []
        return [
            ToolCall(name=part.function_call.name, args=dict(part.function_call.args))
            for part in candidate.content.parts
            if part.function_call is not None
        ]

    def extract_text(self, response: Any) -> str:
        candidate = response.candidates[0]
        if candidate.content is None:
            return ""
        return "\n".join(
            p.text for p in candidate.content.parts if p.text
        )

    # ------------------------------------------------------------------
    # History mutation
    # ------------------------------------------------------------------

    def append_assistant_turn(self, messages: list, response: Any) -> None:
        messages.append(response.candidates[0].content)

    def append_tool_results(
        self,
        messages: list,
        results: list[tuple[str, str, dict]],
    ) -> None:
        # Gemini requires tool results as role="user" with function_response parts.
        # call_id is unused by Gemini — only name + result matter.
        parts = [
            types.Part.from_function_response(name=name, response=result)
            for name, _call_id, result in results
        ]
        messages.append(types.Content(role="user", parts=parts))
