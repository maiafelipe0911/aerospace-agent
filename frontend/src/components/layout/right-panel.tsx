import { useMemo } from "react";
import { useChatStore, type MessagePart } from "@/stores/chat-store";
import { ToolResultCard } from "../tools/tool-result-card";
import { ScrollArea } from "@/components/ui/scroll-area";

const TOOL_CATEGORY: Record<string, string> = {
  calculate_hohmann: "transfers",
  calculate_bielliptic: "transfers",
  calculate_combined_transfer: "transfers",
  calculate_tsiolkovsky_simple: "propulsion",
  calculate_tsiolkovsky_general: "propulsion",
  calculate_orbital_period: "orbital_info",
  calculate_orbital_velocity: "orbital_info",
  calculate_inclination_change: "orbital_info",
};

const CATEGORY_LABELS: Record<string, string> = {
  transfers: "Transfers",
  propulsion: "Propulsion",
  orbital_info: "Orbital Info",
};

const CATEGORY_ORDER = ["transfers", "propulsion", "orbital_info"];

interface ToolResultEntry {
  tool: string;
  result: Record<string, unknown>;
  args?: Record<string, unknown>;
}

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

export function RightPanel() {
  const messages = useChatStore((s) => s.messages);

  const toolResults = useMemo(() => {
    const results: ToolResultEntry[] = [];
    for (const msg of messages) {
      if (msg.role === "assistant") {
        for (let i = 0; i < msg.parts.length; i++) {
          const part = msg.parts[i];
          if (part.kind === "tool_result") {
            const args = findToolCallArgs(msg.parts, i, part.tool);
            results.push({ tool: part.tool, result: part.result, args });
          }
        }
      }
    }
    return results;
  }, [messages]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, ToolResultEntry[]> = {};
    for (const tr of toolResults) {
      const cat = TOOL_CATEGORY[tr.tool] ?? "orbital_info";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tr);
    }
    return groups;
  }, [toolResults]);

  const activeCategories = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length);
  const useGrouping = activeCategories.length > 1;

  return (
    <div className="flex flex-col h-full border-l border-border">
      <div className="h-12 flex items-center px-4 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Calculation Results</h3>
      </div>
      <ScrollArea className="flex-1 p-4">
        {toolResults.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 text-center mt-8">
            Tool results will appear here
          </p>
        ) : useGrouping ? (
          <div className="space-y-4">
            {activeCategories.map((cat) => (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {CATEGORY_LABELS[cat]}
                </h4>
                <div className="space-y-3">
                  {grouped[cat].map((tr, i) => (
                    <ToolResultCard
                      key={`${cat}-${i}`}
                      tool={tr.tool}
                      result={tr.result}
                      toolCallArgs={tr.args}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {toolResults.map((tr, i) => (
              <ToolResultCard
                key={i}
                tool={tr.tool}
                result={tr.result}
                toolCallArgs={tr.args}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
