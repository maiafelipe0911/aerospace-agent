"""
Abstract base class for LLM provider adapters.

Each adapter translates between the provider-agnostic agentic loop
and a specific LLM provider's SDK (Gemini, Claude, OpenAI).

The loop owns the control flow; adapters own only the format translation.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolCall:
    name: str
    args: dict
    # Provider-specific ID, needed by some providers (Claude, OpenAI) to correlate results
    call_id: str = field(default="")


class LLMProvider(ABC):

    @abstractmethod
    def translate_tools(self, tool_defs: list[dict]) -> Any:
        """Convert TOOL_DEFINITIONS into the provider-specific tool format."""

    @abstractmethod
    def build_messages(self, history: list[dict], message: str) -> list:
        """
        Convert frontend history dicts + the new user message into the
        provider-specific message list used as the conversation context.
        """

    @abstractmethod
    def generate(self, messages: list, tools: Any, api_key: str, model: str) -> Any:
        """
        Blocking LLM call. Returns the raw provider response object.
        Called via asyncio.to_thread() from the agentic loop.
        """

    @abstractmethod
    def parse_tool_calls(self, response: Any) -> list[ToolCall]:
        """
        Extract tool calls from a response.
        Returns an empty list if the model produced a text response with no tool calls.
        """

    @abstractmethod
    def extract_text(self, response: Any) -> str:
        """Extract the final text content from a response."""

    @abstractmethod
    def append_assistant_turn(self, messages: list, response: Any) -> None:
        """
        Append the model's turn (including any tool call requests) to the
        in-progress messages list so the next generate() call has full context.
        Mutates `messages` in-place.
        """

    @abstractmethod
    def append_tool_results(
        self,
        messages: list,
        results: list[tuple[str, str, dict]],
    ) -> None:
        """
        Append tool results to the messages list.
        `results` is a list of (tool_name, call_id, result_dict) tuples.
        Mutates `messages` in-place.
        """
