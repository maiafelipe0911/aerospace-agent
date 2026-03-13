import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { fetchModels, FALLBACK_PROVIDERS } from "@/api/models";
import { ApiKeyInput } from "./api-key-input";
import type { ProviderInfo } from "@/api/types";

export function ApiKeyPanel() {
  const { apiKeys, setApiKey } = useSettingsStore();
  const [providers, setProviders] = useState<ProviderInfo[]>(FALLBACK_PROVIDERS);

  useEffect(() => {
    fetchModels().then(setProviders).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        API Keys
      </h3>
      {providers.map((p) => (
        <ApiKeyInput
          key={p.id}
          provider={p.id}
          providerName={p.name}
          value={apiKeys[p.id] ?? ""}
          onChange={(key) => setApiKey(p.id, key)}
        />
      ))}
    </div>
  );
}
