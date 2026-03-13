import type { ChatRequest, SSEEvent } from "./types";

/**
 * Streams chat via POST /api/chat using Fetch API (not EventSource,
 * which doesn't support POST or custom headers).
 */
export async function streamChat(
  request: ChatRequest,
  apiKey: string,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    const message = detail?.trim()
      ? `HTTP ${response.status}: ${detail}`
      : response.status === 500
        ? "Cannot reach the backend server. Make sure the backend is running on port 8080."
        : `HTTP ${response.status}: ${response.statusText}`;
    onEvent({ type: "error", detail: message });
    onEvent({ type: "done" });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onEvent({ type: "error", detail: "No response body" });
    onEvent({ type: "done" });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const flushBuffer = () => {
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const chunk of lines) {
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent;
            onEvent(event);
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      // Process any data in this chunk before checking done
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
        flushBuffer();
      }

      if (done) break;
    }

    // Flush any remaining data that wasn't terminated with \n\n
    if (buffer.trim()) {
      buffer += "\n\n";
      flushBuffer();
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      onEvent({
        type: "error",
        detail: (err as Error).message || "Connection lost",
      });
      onEvent({ type: "done" });
    }
  }
}
