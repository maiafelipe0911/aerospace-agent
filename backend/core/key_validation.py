"""
BYOK key format validation and auth error classification.

Catches misformatted keys before making LLM calls, and maps raw SDK
exceptions to user-friendly error messages.
"""


class InvalidKeyFormatError(ValueError):
    """Raised when an API key doesn't match the expected format for a provider."""


# Expected key prefixes per provider
_KEY_PREFIXES: dict[str, tuple[str, ...]] = {
    "gemini": ("AI",),
    "claude": ("sk-ant-",),
    "openai": ("sk-",),
    "groq": ("gsk_",),
    "openrouter": ("sk-or-",),
}


def validate_key_format(api_key: str, provider: str) -> None:
    """
    Validates that the API key starts with the expected prefix for the provider.
    Raises InvalidKeyFormatError with a hint if it doesn't.
    Skips validation for unknown providers.
    """
    prefixes = _KEY_PREFIXES.get(provider)
    if prefixes is None:
        return  # unknown provider — skip validation

    if not any(api_key.startswith(p) for p in prefixes):
        expected = " or ".join(f"'{p}...'" for p in prefixes)
        raise InvalidKeyFormatError(
            f"Invalid API key format for {provider}. "
            f"Keys typically start with {expected}."
        )


def classify_auth_error(exc: Exception, provider: str) -> dict:
    """
    Maps raw SDK exceptions to user-friendly error dicts.

    Returns {"detail": str, "is_auth": bool} so callers can distinguish
    authentication failures from transient/model errors.

    Handles google-genai, anthropic, and openai SDK error types.
    """
    exc_type = type(exc).__name__
    message = str(exc)

    # --- Google GenAI ---
    try:
        from google.genai.errors import ClientError
        if isinstance(exc, ClientError):
            status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
            msg_lower = message.lower()
            if status == 401 or "unauthorized" in msg_lower or "api key not valid" in msg_lower:
                return {"detail": f"API key rejected by {provider}. Please check that your Gemini key is valid.", "is_auth": True}
            if status == 403 or "permission" in msg_lower:
                return {"detail": f"Key lacks permissions for {provider}. Ensure the key has the required API access.", "is_auth": True}
            if status == 429 or "rate" in msg_lower:
                return {"detail": f"Rate limit exceeded for {provider}. Please wait and try again.", "is_auth": False}
            return {"detail": f"LLM request failed ({provider}): {message}", "is_auth": False}
    except ImportError:
        pass

    # --- Anthropic ---
    try:
        import anthropic
        if isinstance(exc, anthropic.AuthenticationError):
            return {"detail": f"API key rejected by {provider}. Please check that your Anthropic key is valid.", "is_auth": True}
        if isinstance(exc, anthropic.PermissionDeniedError):
            return {"detail": f"Key lacks permissions for {provider}. Ensure the key has the required API access.", "is_auth": True}
        if isinstance(exc, anthropic.RateLimitError):
            return {"detail": f"Rate limit exceeded for {provider}. Please wait and try again.", "is_auth": False}
    except ImportError:
        pass

    # --- OpenAI SDK (also used by Groq and OpenRouter) ---
    try:
        import openai
        if isinstance(exc, openai.AuthenticationError):
            return {"detail": f"API key rejected by {provider}. Please check that your {provider} key is valid.", "is_auth": True}
        if isinstance(exc, openai.PermissionDeniedError):
            return {"detail": f"Key lacks permissions for {provider}. Ensure the key has the required API access.", "is_auth": True}
        if isinstance(exc, openai.RateLimitError):
            return {"detail": f"Rate limit exceeded for {provider}. Please wait and try again.", "is_auth": False}
    except ImportError:
        pass

    # Catch-all
    return {"detail": f"LLM request failed ({provider}): {message}", "is_auth": False}
