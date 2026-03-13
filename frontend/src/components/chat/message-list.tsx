import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessage } from "./chat-message";
import { StreamingIndicator } from "./streaming-indicator";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";

interface MessageListProps {
  onPromptClick: (text: string) => void;
}

export function MessageList({ onPromptClick }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return <WelcomeScreen onPromptClick={onPromptClick} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((msg, i) => (
        <ChatMessage key={i} message={msg} />
      ))}
      {isStreaming && (
        <div className="flex gap-3 mb-3">
          <div className="w-7 h-7" />
          <StreamingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
