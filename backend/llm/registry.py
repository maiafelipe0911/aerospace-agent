"""
Provider registry — maps provider IDs to adapter instances and model lists.

`get_provider(provider_id)` is the single entry point used by the agentic loop.
`list_providers()` drives the GET /api/models response.
"""

from .base import LLMProvider
from .gemini import GeminiProvider
from .claude import ClaudeProvider
from .openai_adapter import OpenAIProvider
from .groq_adapter import GroqProvider
from .openrouter_adapter import OpenRouterProvider

# ---------------------------------------------------------------------------
# Adapter singletons (stateless — safe to share across requests)
# ---------------------------------------------------------------------------

_PROVIDERS: dict[str, LLMProvider] = {
    "gemini": GeminiProvider(),
    "claude": ClaudeProvider(),
    "openai": OpenAIProvider(),
    "groq": GroqProvider(),
    "openrouter": OpenRouterProvider(),
}

# ---------------------------------------------------------------------------
# Model catalogue — used by GET /api/models
# ---------------------------------------------------------------------------

_PROVIDER_MODELS: dict[str, dict] = {
    "gemini": {
        "id": "gemini",
        "name": "Google Gemini",
        "models": [
            {
                "id": "gemini-2.5-flash",
                "name": "Gemini 2.5 Flash",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "gemini-2.0-flash",
                "name": "Gemini 2.0 Flash",
                "supports_streaming": True,
                "supports_tools": True,
            },
        ],
    },
    "claude": {
        "id": "claude",
        "name": "Anthropic Claude",
        "models": [
            {
                "id": "claude-sonnet-4-6",
                "name": "Claude Sonnet 4.6",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "claude-opus-4-6",
                "name": "Claude Opus 4.6",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "claude-haiku-4-5-20251001",
                "name": "Claude Haiku 4.5",
                "supports_streaming": True,
                "supports_tools": True,
            },
        ],
    },
    "openai": {
        "id": "openai",
        "name": "OpenAI",
        "models": [
            {
                "id": "gpt-4o",
                "name": "GPT-4o",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "gpt-4o-mini",
                "name": "GPT-4o Mini",
                "supports_streaming": True,
                "supports_tools": True,
            },
        ],
    },
    "groq": {
        "id": "groq",
        "name": "Groq",
        "models": [
            {
                "id": "llama-3.3-70b-versatile",
                "name": "Llama 3.3 70B",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "meta-llama/llama-4-scout-17b-16e-instruct",
                "name": "Llama 4 Scout 17B",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "qwen/qwen3-32b",
                "name": "Qwen3 32B",
                "supports_streaming": True,
                "supports_tools": True,
            },
        ],
    },
    "openrouter": {
        "id": "openrouter",
        "name": "OpenRouter",
        "models": [
            {
                "id": "nvidia/nemotron-3-nano-30b-a3b:free",
                "name": "Nemotron Nano 30B (Free)",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "stepfun/step-3.5-flash:free",
                "name": "Step 3.5 Flash (Free)",
                "supports_streaming": True,
                "supports_tools": True,
            },
            {
                "id": "arcee-ai/trinity-large-preview:free",
                "name": "Trinity Large (Free)",
                "supports_streaming": True,
                "supports_tools": True,
            },
        ],
    },
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_provider(provider_id: str) -> LLMProvider:
    """Return the adapter for the given provider ID.

    Raises ValueError for unknown providers so the caller can surface a
    clean 400 error rather than a cryptic KeyError.
    """
    provider = _PROVIDERS.get(provider_id)
    if provider is None:
        known = ", ".join(_PROVIDERS.keys())
        raise ValueError(
            f"Unknown provider '{provider_id}'. Known providers: {known}"
        )
    return provider


def list_providers() -> list[dict]:
    """Return all providers and their models, ordered for the /api/models response."""
    return list(_PROVIDER_MODELS.values())
