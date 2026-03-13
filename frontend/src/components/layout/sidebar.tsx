import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Rocket } from "lucide-react";
import { ApiKeyPanel } from "../settings/api-key-panel";
import { ModelSelector } from "../settings/model-selector";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { useMissionStore } from "@/stores/mission-store";

export function SidebarContent() {
  const clearChat = useChatStore((s) => s.clearChat);
  const hasMessages = useChatStore((s) => s.messages.length > 0);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const resetMission = useMissionStore((s) => s.resetMission);

  function handleNewMission() {
    resetMission();
    setActiveView("mission");
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <ApiKeyPanel />
      <Separator />
      <ModelSelector />
      <Separator />
      <div className="mt-auto space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleNewMission}
        >
          <Rocket className="w-3.5 h-3.5 mr-1.5" />
          New Mission
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={clearChat}
          disabled={!hasMessages}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear Chat
        </Button>
      </div>
    </div>
  );
}
