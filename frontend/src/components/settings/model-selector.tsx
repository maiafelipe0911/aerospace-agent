import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import { fetchModels, FALLBACK_PROVIDERS } from "@/api/models";
import type { ProviderInfo } from "@/api/types";

export function ModelSelector() {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const setModel = useSettingsStore((s) => s.setModel);
  const setProvider = useSettingsStore((s) => s.setProvider);
  const [providers, setProviders] = useState<ProviderInfo[]>(FALLBACK_PROVIDERS);

  useEffect(() => {
    fetchModels().then(setProviders).catch(() => {});
  }, []);

  // Only show providers that have a key configured
  const availableProviders = useMemo(
    () => providers.filter((p) => apiKeys[p.id]?.trim()),
    [providers, apiKeys]
  );

  // Auto-select the first available model when current selection doesn't match
  useEffect(() => {
    if (availableProviders.length === 0) return;

    const hasMatch = availableProviders.some((p) =>
      p.models.some((m) => m.id === selectedModel)
    );

    if (!hasMatch) {
      const first = availableProviders[0];
      const firstModel = first.models[0];
      if (firstModel) {
        setModel(firstModel.id);
        setProvider(first.id);
      }
    }
  }, [availableProviders, selectedModel, setModel, setProvider]);

  const handleChange = (modelId: string | null) => {
    if (!modelId) return;
    setModel(modelId);
    for (const p of providers) {
      if (p.models.some((m) => m.id === modelId)) {
        setProvider(p.id);
        break;
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Model
      </h3>
      {availableProviders.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">
          Enter an API key to select a model
        </p>
      ) : (
        <Select value={selectedModel} onValueChange={handleChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((p) => (
              <SelectGroup key={p.id}>
                <SelectLabel className="text-xs">{p.name}</SelectLabel>
                {p.models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
