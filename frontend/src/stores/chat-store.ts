import { create } from "zustand";
import type { HistoryEntry } from "@/api/types";

// Message part types for multi-part assistant messages
export type MessagePart =
  | { kind: "status"; content: string }
  | { kind: "tool_call"; tool: string; args: Record<string, unknown> }
  | { kind: "tool_result"; tool: string; result: Record<string, unknown> }
  | { kind: "text"; content: string }
  | { kind: "error"; content: string };

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; parts: MessagePart[] };

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  history: HistoryEntry[];
  pendingPrompt: string | null;

  addUserMessage: (content: string) => void;
  startAssistantMessage: () => void;
  addPart: (part: MessagePart) => void;
  appendText: (text: string) => void;
  finishStreaming: (assistantText: string) => void;
  clearChat: () => void;
  setPendingPrompt: (text: string | null) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  history: [],
  pendingPrompt: null,

  addUserMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { role: "user", content }],
      isStreaming: true,
    })),

  startAssistantMessage: () =>
    set((s) => ({
      messages: [...s.messages, { role: "assistant", parts: [] }],
    })),

  addPart: (part) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        msgs[msgs.length - 1] = {
          ...last,
          parts: [...last.parts, part],
        };
      }
      return { messages: msgs };
    }),

  appendText: (text) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") {
        const parts = [...last.parts];
        const lastPart = parts[parts.length - 1];
        if (lastPart?.kind === "text") {
          parts[parts.length - 1] = {
            ...lastPart,
            content: lastPart.content + text,
          };
        } else {
          parts.push({ kind: "text", content: text });
        }
        msgs[msgs.length - 1] = { ...last, parts };
      }
      return { messages: msgs };
    }),

  finishStreaming: (assistantText) =>
    set((s) => {
      const userMsg = [...s.messages].reverse().find((m): m is Extract<ChatMessage, { role: "user" }> => m.role === "user");
      const newHistory: HistoryEntry[] = [...s.history];
      if (userMsg) {
        newHistory.push({ role: "user", text: userMsg.content });
      }
      if (assistantText) {
        newHistory.push({ role: "model", text: assistantText });
      }
      return { isStreaming: false, history: newHistory };
    }),

  clearChat: () => set({ messages: [], history: [], isStreaming: false, pendingPrompt: null }),

  setPendingPrompt: (text) => set({ pendingPrompt: text }),
}));
