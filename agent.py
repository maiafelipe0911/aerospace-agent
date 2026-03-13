"""
ARIA CLI — multi-provider interactive agent.

Usage:
    python agent.py                        # default: Gemini
    python agent.py --provider claude
    python agent.py --provider openai
    python agent.py --provider gemini --model gemini-2.5-pro
"""

import argparse
import os
import sys

from dotenv import load_dotenv

from point import OrbitalEngine
from backend.llm import get_provider
from backend.core.tools import TOOL_DEFINITIONS, TOOL_STATUS_MESSAGES, SYSTEM_PROMPT, dispatch_tool

# ── Default models per provider ──────────────────────────────────────────

DEFAULT_MODELS = {
    "gemini": "gemini-2.5-flash",
    "claude": "claude-sonnet-4-6",
    "openai": "gpt-4o",
}

# ── Provider → env-var mapping ───────────────────────────────────────────

KEY_ENV_VARS = {
    "gemini": "GEMINI_API_KEY",
    "claude": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
}


def main():
    parser = argparse.ArgumentParser(description="ARIA — Aerospace Reasoning & Intelligence Agent (CLI)")
    parser.add_argument("--provider", default="gemini", choices=["gemini", "claude", "openai"],
                        help="LLM provider (default: gemini)")
    parser.add_argument("--model", default=None,
                        help="Model name (default: provider-specific)")
    args = parser.parse_args()

    provider_id = args.provider
    model = args.model or DEFAULT_MODELS.get(provider_id, "")

    # Load API key from key.env
    load_dotenv("key.env")
    env_var = KEY_ENV_VARS.get(provider_id)
    api_key = os.getenv(env_var) if env_var else None

    if not api_key:
        print(f"Error: {env_var} not found in key.env or environment.")
        sys.exit(1)

    # Initialize engine and provider
    engine = OrbitalEngine()
    provider = get_provider(provider_id)

    print("=" * 55)
    print("  ARIA — Aerospace Reasoning & Intelligence Agent")
    print(f"  Provider: {provider_id} | Model: {model}")
    print("=" * 55)
    print("  Agent ready. Type 'exit' to quit.")
    print("=" * 55)

    history: list[dict] = []

    while True:
        print()
        try:
            user_input = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "bye"):
            print("\nShutting down ARIA. See you on the next mission!")
            break

        print("\nARIA: Analyzing request...")

        tools = provider.translate_tools(TOOL_DEFINITIONS)
        messages = provider.build_messages(history, user_input)

        max_tool_rounds = 5
        response = None

        for _round in range(max_tool_rounds + 1):
            response = provider.generate(messages, tools, api_key, model)
            tool_calls = provider.parse_tool_calls(response)

            if not tool_calls:
                break

            provider.append_assistant_turn(messages, response)

            results: list[tuple[str, str, dict]] = []
            for tc in tool_calls:
                status_msg = TOOL_STATUS_MESSAGES.get(tc.name, f"Running {tc.name}...")
                print(f"\n  >> {status_msg}")
                print(f"     Tool: {tc.name} | Args: {tc.args}")

                result = dispatch_tool(tc.name, tc.args, engine)
                print(f"     Result: {result}")
                results.append((tc.name, tc.call_id, result))

            provider.append_tool_results(messages, results)

        if response is None:
            print("ARIA: I'm sorry, I couldn't generate a response. Please try again.")
            continue

        final_text = provider.extract_text(response)
        if final_text:
            print(f"\nARIA: {final_text}")
            history.append({"role": "user", "text": user_input})
            history.append({"role": "model", "text": final_text})
        else:
            print("ARIA: I'm sorry, I couldn't generate a response. Please try again.")


if __name__ == "__main__":
    main()
