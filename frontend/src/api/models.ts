import type { ProviderInfo, HealthResponse } from "./types";

export const FALLBACK_PROVIDERS: ProviderInfo[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", supports_streaming: true, supports_tools: true },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", supports_streaming: true, supports_tools: true },
    ],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", supports_streaming: true, supports_tools: true },
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", supports_streaming: true, supports_tools: true },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", supports_streaming: true, supports_tools: true },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o", supports_streaming: true, supports_tools: true },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", supports_streaming: true, supports_tools: true },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", supports_streaming: true, supports_tools: true },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", supports_streaming: true, supports_tools: true },
      { id: "qwen/qwen3-32b", name: "Qwen3 32B", supports_streaming: true, supports_tools: true },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    models: [
      { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron Nano 30B (Free)", supports_streaming: true, supports_tools: true },
      { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash (Free)", supports_streaming: true, supports_tools: true },
      { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large (Free)", supports_streaming: true, supports_tools: true },
    ],
  },
];

export async function fetchModels(): Promise<ProviderInfo[]> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  const data = await res.json();
  return data.providers ?? data;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error(`Failed to fetch health: ${res.status}`);
  const data = await res.json();
  return {
    status: data.status,
    engine_loaded: data.engine === "loaded",
  };
}
