import { useCallback } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChatStore } from "@/stores/chat-store";

export function ChatArea() {
  const setPendingPrompt = useChatStore((s) => s.setPendingPrompt);

  const handlePromptClick = useCallback(
    (text: string) => {
      setPendingPrompt(text);
    },
    [setPendingPrompt],
  );

  return (
    <div className="flex flex-col h-full">
      <MessageList onPromptClick={handlePromptClick} />
      <ChatInput />
    </div>
  );
}
