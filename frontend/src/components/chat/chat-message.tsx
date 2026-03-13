import type { ChatMessage as ChatMessageType, MessagePart } from "@/stores/chat-store";
import { MarkdownRenderer } from "./markdown-renderer";
import { ToolCallCard } from "../tools/tool-call-card";
import { ToolResultCard } from "../tools/tool-result-card";
import { AlertCircle, Orbit } from "lucide-react";

function findToolCallArgs(
  parts: MessagePart[],
  resultIndex: number,
  toolName: string
): Record<string, unknown> | undefined {
  for (let i = resultIndex - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.kind === "tool_call" && p.tool === toolName) return p.args;
    if (p.kind === "tool_result") break;
  }
}

function PartRenderer({
  part,
  parts,
  index,
}: {
  part: MessagePart;
  parts: MessagePart[];
  index: number;
}) {
  switch (part.kind) {
    case "status":
      return null;
    case "tool_call":
      return (
        <ToolCallCard
          tool={part.tool}
          args={part.args}
          completed={parts[index + 1]?.kind === "tool_result"}
        />
      );
    case "tool_result":
      return (
        <ToolResultCard
          tool={part.tool}
          result={part.result}
          toolCallArgs={findToolCallArgs(parts, index, part.tool)}
        />
      );
    case "text":
      return <MarkdownRenderer content={part.content} />;
    case "error":
      return (
        <div className="flex items-center gap-2 text-red-400 text-sm my-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {part.content}
        </div>
      );
  }
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-blue-600/20 border border-blue-500/20 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Orbit className="w-4 h-4 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0 text-sm">
        {message.parts.map((part, i) => (
          <PartRenderer key={i} part={part} parts={message.parts} index={i} />
        ))}
      </div>
    </div>
  );
}
