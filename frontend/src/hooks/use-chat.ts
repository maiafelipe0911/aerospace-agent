import { useRef, useCallback } from "react";
import { streamChat } from "@/api/client";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { SSEEvent } from "@/api/types";

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);

  const {
    addUserMessage,
    startAssistantMessage,
    addPart,
    appendText,
    finishStreaming,
    isStreaming,
    history,
  } = useChatStore();

  const { apiKeys, activeProvider, selectedModel } = useSettingsStore();

  const apiKey = apiKeys[activeProvider] ?? "";

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !apiKey) return;

      addUserMessage(content);
      startAssistantMessage();

      const controller = new AbortController();
      abortRef.current = controller;

      let fullText = "";

      const onEvent = (event: SSEEvent) => {
        switch (event.type) {
          case "status":
            addPart({ kind: "status", content: event.content });
            break;
          case "tool_call":
            addPart({ kind: "tool_call", tool: event.tool, args: event.args });
            break;
          case "tool_result":
            addPart({
              kind: "tool_result",
              tool: event.tool,
              result: event.result,
            });
            break;
          case "text":
            appendText(event.content);
            fullText += event.content;
            break;
          case "error":
            addPart({ kind: "error", content: event.detail });
            break;
          case "done":
            finishStreaming(fullText);
            break;
        }
      };

      try {
        await streamChat(
          {
            message: content,
            history,
            model: selectedModel,
            provider: activeProvider,
          },
          apiKey,
          onEvent,
          controller.signal
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          addPart({
            kind: "error",
            content: (err as Error).message || "Could not reach the backend. Is the server running?",
          });
          finishStreaming("");
        }
      }

      abortRef.current = null;
    },
    [
      apiKey,
      activeProvider,
      selectedModel,
      history,
      addUserMessage,
      startAssistantMessage,
      addPart,
      appendText,
      finishStreaming,
    ]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    finishStreaming("");
  }, [finishStreaming]);

  return { sendMessage, stopStreaming, isStreaming, hasApiKey: !!apiKey };
}
