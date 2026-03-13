import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat-store";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, stopStreaming, isStreaming, hasApiKey } = useChat();
  const pendingPrompt = useChatStore((s) => s.pendingPrompt);
  const setPendingPrompt = useChatStore((s) => s.setPendingPrompt);

  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      setPendingPrompt(null);
      textareaRef.current?.focus();
    }
  }, [pendingPrompt, setPendingPrompt]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            hasApiKey
              ? "Ask ARIA about orbital mechanics..."
              : "Enter your API key in the sidebar to get started"
          }
          disabled={!hasApiKey}
          rows={1}
          className="flex-1 resize-none bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm
                     placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isStreaming ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={stopStreaming}
            className="shrink-0 h-10 w-10"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || !hasApiKey}
            className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
