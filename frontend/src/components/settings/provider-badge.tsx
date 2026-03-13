import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDER_COLORS: Record<string, string> = {
  gemini: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  claude: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  openai: "bg-green-500/20 text-green-300 border-green-500/30",
  groq: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  openrouter: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const PROVIDER_NAMES: Record<string, string> = {
  gemini: "Gemini",
  claude: "Claude",
  openai: "OpenAI",
  groq: "Groq",
  openrouter: "OpenRouter",
};

export function ProviderBadge() {
  const provider = useSettingsStore((s) => s.activeProvider);
  const color = PROVIDER_COLORS[provider] ?? "bg-muted text-muted-foreground";
  const name = PROVIDER_NAMES[provider] ?? provider;

  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {name}
    </Badge>
  );
}
