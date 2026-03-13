import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  PanelRightOpen,
  PanelRightClose,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { ProviderBadge } from "../settings/provider-badge";
import { fetchHealth } from "@/api/models";

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const [engineOk, setEngineOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () =>
      fetchHealth()
        .then((h) => setEngineOk(h.engine_loaded))
        .catch(() => setEngineOk(false));
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 border-b border-border flex items-center px-3 gap-3 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2">
        <span className="font-bold text-base tracking-wide">ARIA</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Aerospace Reasoning & Intelligence Agent
        </span>
      </div>

      {/* View toggle */}
      <div className="flex rounded-md border border-border overflow-hidden ml-2">
        <button
          onClick={() => setActiveView("chat")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors ${
            activeView === "chat"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <button
          onClick={() => setActiveView("mission")}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-colors border-l border-border ${
            activeView === "mission"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Rocket className="w-3 h-3" />
          <span className="hidden sm:inline">Mission</span>
        </button>
      </div>

      <div className="flex-1" />

      <ProviderBadge />

      <div
        className="flex items-center gap-1.5"
        title={
          engineOk === null
            ? "Checking engine..."
            : engineOk
              ? "Engine loaded"
              : "Engine offline"
        }
      >
        <div
          className={`w-2 h-2 rounded-full ${
            engineOk === null
              ? "bg-yellow-400"
              : engineOk
                ? "bg-green-400"
                : "bg-red-400"
          }`}
        />
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {engineOk === null ? "..." : engineOk ? "Engine" : "Offline"}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hidden lg:flex"
        onClick={toggleRightPanel}
      >
        {rightPanelOpen ? (
          <PanelRightClose className="w-4 h-4" />
        ) : (
          <PanelRightOpen className="w-4 h-4" />
        )}
      </Button>
    </header>
  );
}
