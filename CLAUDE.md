# ARIA — Aerospace Reasoning & Intelligence Agent

An AI-powered aerospace engineering assistant that answers questions about orbital mechanics and rocket propulsion. A multi-provider LLM acts as the reasoning layer; all numerical calculations are delegated to a high-precision C++ physics engine exposed via a compiled Windows DLL. Users interact through a dark-themed, mission-control-inspired web UI.

**Current phase: 6 — Deployment & Polish. Multi-stage Dockerfile (frontend build + C++ compile + slim runtime), FastAPI serves frontend static files in production, pytest test suite (25 tests covering physics engine + API endpoints), GitHub Actions CI, welcome screen with clickable example prompts and BYOK onboarding, professional README, MIT license, and CONTRIBUTING guide.**

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui (base-ui), Zustand, D3, React Three Fiber |
| LLM | Gemini, Claude, OpenAI, Groq, OpenRouter (provider-agnostic adapter layer) |
| Backend API | FastAPI + uvicorn |
| Agent orchestration | Python 3 (async) |
| Physics engine | C++ (compiled to `orbital.dll` / `liborbital.so` / `liborbital.dylib`) |
| Python/C++ bridge | `ctypes` FFI |
| Config | `python-dotenv` (`key.env`) |
| CI | GitHub Actions (Python lint + pytest, frontend lint + build) |
| Testing | pytest + httpx (backend), ESLint + TypeScript strict (frontend) |

## Project Structure

```
agent.py                  — Multi-provider CLI (Gemini, Claude, OpenAI, Groq, OpenRouter via --provider flag)
agent_legacy.py           — Original Gemini-only CLI (kept for reference)
point.py                  — OrbitalEngine: Python wrapper around C++ library via ctypes
orbital_mechanics.cpp     — C++ source for all physics calculations
orbital.dll               — Compiled Windows DLL (pre-built)
key.env                   — API keys (gitignored)
requirements.txt          — Python dependencies (includes pytest, httpx for testing)
README.md                 — Professional README with badges, architecture, quick start
LICENSE                   — MIT license
CONTRIBUTING.md           — Development setup and contribution guidelines
.env.example              — Template for API key configuration
scripts/
  build_engine.sh         — Cross-platform build script (Linux/macOS/Windows-MSYS)
Dockerfile                — Multi-stage build (Node frontend → C++ engine → Python slim runtime)
.dockerignore             — Excludes caches, keys, platform-specific binaries
.github/
  workflows/
    ci.yml                — CI pipeline: backend lint+test, frontend lint+build
tests/
  conftest.py             — Shared fixtures (OrbitalEngine instance, FastAPI TestClient)
  test_engine.py          — Physics engine tests (~17 tests, all 8 calculation methods)
  test_api.py             — API endpoint tests (~8 tests, health/models/calculate)
backend/
  main.py                 — FastAPI app, CORS (configurable), lifespan, static file serving in production
  routers/
    chat.py               — POST /api/chat (SSE) + WebSocket /ws/chat
    calculate.py          — POST /api/calculate/{tool_name}
    info.py               — GET /api/health + GET /api/models (pulls from llm registry)
  core/
    engine.py             — OrbitalEngine singleton + get_engine() dependency
    tools.py              — TOOL_DEFINITIONS + TOOL_STATUS_MESSAGES + SYSTEM_PROMPT + dispatch_tool()
    agent_loop.py         — Provider-agnostic async agentic loop (with key validation + status events)
    key_validation.py     — BYOK format validation + auth error classification
  llm/
    base.py               — LLMProvider ABC + ToolCall dataclass
    gemini.py             — Google Gemini adapter
    claude.py             — Anthropic Claude adapter
    openai_adapter.py     — OpenAI adapter
    groq_adapter.py       — Groq adapter (OpenAI-compatible, Llama / Qwen)
    openrouter_adapter.py — OpenRouter adapter (OpenAI-compatible, free models)
    registry.py           — Provider map + get_provider() + list_providers()
    __init__.py           — Re-exports get_provider, list_providers
frontend/
  index.html              — Entry HTML (class="dark" on <html> for dark-only theme)
  vite.config.ts          — Vite config with Tailwind plugin, @ alias, dev proxy to backend
  tsconfig.app.json       — TypeScript config (ES2023 target, @ path alias)
  src/
    index.css             — Tailwind + shadcn imports, aerospace dark palette (oklch), orbit color tokens, height chain
    App.tsx               — Root: ErrorBoundary > TooltipProvider > AppShell
    api/
      types.ts            — SSEEvent (discriminated union), ChatRequest, ProviderInfo, result shapes, HohmannToolCallArgs
      client.ts           — streamChat(): Fetch-based SSE consumer with AbortController support
      models.ts           — fetchModels(), fetchHealth() — unwraps backend response shapes
    stores/
      settings-store.ts   — API keys (sessionStorage), active provider, selected model (Zustand persist)
      chat-store.ts       — Messages with multi-part assistant messages (MessagePart union type)
      ui-store.ts         — Sidebar, right panel toggle state + activeView ("chat" | "mission")
      visualization-store.ts — Active visualization data, view mode (2D/3D), fullscreen state
      mission-store.ts    — Full wizard state: step tracking, orbit params, Hohmann/Tsiolkovsky results, spacecraft config
    hooks/
      use-chat.ts         — Orchestrates: settings → streamChat() → SSE events → chat store
      use-media-query.ts  — Responsive breakpoint hook for mobile/desktop layout switching
      use-mission-calculations.ts — Async helpers: calculateHohmann() + calculateTsiolkovsky() via /api/calculate/*
    lib/
      orbital-math.ts     — Pure TS orbital geometry computation (derives viz data from altitudes)
      mission-math.ts     — ispToExhaustVelocity(), exhaustVelocityToIsp(), computeFeasibility()
    components/
      error-boundary.tsx  — Class component error boundary with inline-styled crash screen
      onboarding/
        welcome-screen.tsx  — Empty-state welcome with BYOK explainer + 4 clickable example prompt cards
      layout/
        app-shell.tsx     — 3-column responsive grid: sidebar (280px) | chat OR mission builder | right panel (360px) + orbit dialog
        header.tsx        — ARIA title, provider badge, engine health dot, Chat/Mission view toggle
        sidebar.tsx       — API key panel + model selector + New Mission button + clear chat button
        right-panel.tsx   — Aggregated tool result cards from conversation
      settings/
        api-key-input.tsx — Password input with show/hide toggle + "Test" validation button
        api-key-panel.tsx — Three API key inputs (one per provider, with fallback if backend is down)
        model-selector.tsx — shadcn Select grouped by provider (only providers with keys are shown)
        provider-badge.tsx — Colored badge showing active provider name
      chat/
        chat-area.tsx     — Combines message list + input in a flex column
        message-list.tsx  — Maps messages to ChatMessage components, auto-scrolls, empty state
        chat-message.tsx  — Multi-part renderer: status, tool calls, tool results, markdown, errors; pairs tool_call args with results
        chat-input.tsx    — Auto-growing textarea, Enter to send, stop button during streaming
        streaming-indicator.tsx — Animated bouncing dots
        markdown-renderer.tsx   — react-markdown + remark-gfm + rehype-highlight, dark code blocks
      tools/
        tool-call-card.tsx      — Status message + spinner (or checkmark when completed)
        tool-result-card.tsx    — Router: delegates to viz card, Hohmann, Tsiolkovsky, or JSON fallback
        hohmann-result.tsx      — Blue-accented card: Delta-V1, Delta-V2, Total, Time of Flight
        tsiolkovsky-result.tsx  — Amber-accented card: Delta-V, Propellant Mass, Mass Ratio
      visualization/
        hohmann-viz-card.tsx    — Enhanced Hohmann card with compact 2D preview + expand button
        orbit-viewer.tsx        — Wrapper: 2D/3D toggle, expand button, lazy-loads 3D viewer
        orbit-viewer-2d.tsx     — SVG orbit diagram (Earth, orbits, transfer ellipse, burn markers)
        orbit-viewer-3d.tsx     — React Three Fiber 3D scene (textured Earth, animated satellite)
        orbit-viewer-dialog.tsx — Fullscreen dialog with visualization + numerical data panel
      mission/
        mission-builder.tsx     — Main wizard container: step navigation, validation gates, ISP↔Ve conversion
        mission-presets.ts      — MISSION_PRESETS (LEO→GEO, LEO→ISS, LEO→Moon, Custom) + ENGINE_PRESETS (4 engines)
        step-indicator.tsx      — Visual step progress bar with clickable completed steps
        summary-metric.tsx      — Reusable metric cell (label, value, unit, optional highlight)
        feasibility-badge.tsx   — Green/red badge with margin or deficit info
        delta-v-chart.tsx       — D3 stacked bar chart: required vs. available delta-v
        steps/
          step-mission-definition.tsx  — Step 1: preset selector, mission name, origin/destination altitudes
          step-transfer-analysis.tsx   — Step 2: auto-runs Hohmann, shows DV budget + inline 2D orbit viewer
          step-spacecraft-config.tsx   — Step 3: dry mass, propellant capacity, ISP↔Ve toggle, engine presets
          step-propellant-analysis.tsx — Step 4: auto-runs Tsiolkovsky, shows feasibility comparison
          step-mission-summary.tsx     — Step 5: full dashboard (metrics grid, orbit viz, DV chart, details panels)
      ui/                 — shadcn/ui components (button, input, card, badge, scroll-area, etc.)
  public/
    textures/
      earth.jpg             — NASA Blue Marble texture for 3D Earth (~580KB)
```

## Running the Full App (Frontend + Backend)

```bash
# Terminal 1 — Backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8080

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Frontend dev server starts at `http://localhost:5173` and proxies `/api` and `/ws` to the backend on port 8080.

## Running the Backend API Only

```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8080
```

Server starts at `http://localhost:8080`. Interactive docs at `http://localhost:8080/docs`.
BYOK: pass your API key as the `X-API-Key` header.

## Running the CLI

```bash
python agent.py                          # default: Gemini
python agent.py --provider claude        # use Claude
python agent.py --provider openai        # use OpenAI
python agent.py --provider gemini --model gemini-2.5-pro  # custom model
```

The agent runs as an interactive CLI loop. Type `exit` to quit.
Set your API key in `key.env` (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY`).

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/docs` |
| `GET` | `/api/health` | Engine load status (`{"status", "engine"}`) |
| `GET` | `/api/models` | All providers and models (`{"providers": [...]}`) |
| `POST` | `/api/chat` | SSE-streamed agentic chat (header: `X-API-Key`) |
| `WS` | `/ws/chat` | WebSocket chat (field: `api_key` in JSON body) |
| `POST` | `/api/calculate/hohmann` | Direct Hohmann transfer calculation |
| `POST` | `/api/calculate/tsiolkovsky_simple` | Direct simple Tsiolkovsky calculation |
| `POST` | `/api/calculate/tsiolkovsky_general` | Direct general Tsiolkovsky calculation |
| `POST` | `/api/calculate/orbital_period` | Orbital period at a given altitude |
| `POST` | `/api/calculate/orbital_velocity` | Vis-viva velocity at a point in an orbit |
| `POST` | `/api/calculate/bielliptic` | Bi-elliptic transfer (3 burns + Hohmann comparison) |
| `POST` | `/api/calculate/inclination_change` | Pure orbital plane change |
| `POST` | `/api/calculate/combined_transfer` | Hohmann + plane change combined at apoapsis |

**Note on response shapes**: `/api/models` wraps the array in `{"providers": [...]}`. `/api/health` returns `{"status": "ok"|"degraded", "engine": "loaded"|"error"}`. The frontend `models.ts` unwraps these into the types the UI expects.

### SSE Event Stream Format (`/api/chat`)

```
data: {"type": "status",      "content": "Calculating Hohmann transfer orbit..."}
data: {"type": "tool_call",   "tool": "calculate_hohmann", "args": {...}}
data: {"type": "tool_result", "tool": "calculate_hohmann", "result": {...}}
data: {"type": "text",        "content": "The total delta-v is..."}
data: {"type": "error",       "detail": "..."}
data: {"type": "done"}
```

### Chat Request Body

```json
{
  "message": "How much delta-v for LEO to GEO?",
  "history": [{"role": "user", "text": "..."}, {"role": "model", "text": "..."}],
  "model": "gemini-2.5-flash",
  "provider": "gemini"
}
```

Supported `provider` values: `"gemini"`, `"claude"`, `"openai"`, `"groq"`, `"openrouter"`.
History entries are plain `{"role", "text"}` dicts — tool calls within a turn are handled internally.

## Testing the Physics Engine in Isolation

```bash
python point.py
```

`point.py:142` exercises all three engine functions directly (no API key required).

## Building the Physics Engine

Cross-platform (recommended):
```bash
bash scripts/build_engine.sh
```

Docker:
```bash
docker build -t aria .
docker run -p 8080:8080 aria
```

Manual (Windows only):
```bash
g++ -O2 -shared -fPIC -o orbital.dll orbital_mechanics.cpp
# or with MSVC:
cl /LD /O2 orbital_mechanics.cpp /Fe:orbital.dll
```

## Adding a New Tool

1. Implement the calculation in `orbital_mechanics.cpp` and rebuild the DLL.
2. Add the ctypes signature and a public method to `OrbitalEngine` in `point.py`.
3. Add an entry to `TOOL_DEFINITIONS` in `backend/core/tools.py`.
4. Add a dispatch branch in `dispatch_tool()` in `backend/core/tools.py`. Note that `point.py` method parameters use Portuguese names (e.g. `alt_origem_km`) — map from the English AI-facing names here.
5. Add a status message to `TOOL_STATUS_MESSAGES` in `backend/core/tools.py`.
6. Add TypeScript result type to `frontend/src/api/types.ts`.
7. Add a result card component in `frontend/src/components/tools/` and register it in `tool-result-card.tsx`.

No adapter changes needed — all providers consume `TOOL_DEFINITIONS` automatically.
The CLI (`agent.py`) and backend both use `dispatch_tool()`, so new tools work everywhere.
The frontend routes tool results by tool name to the appropriate card component.

## Tool Output Reference

| Tool | Returned keys | Units |
|---|---|---|
| `calculate_hohmann` | `delta_v1`, `delta_v2`, `total_delta_v`, `time_of_flight` | km/s, km/s, km/s, hours |
| `calculate_tsiolkovsky_simple` | `delta_v`, `propellant_mass`, `mass_ratio` | km/s, kg, dimensionless |
| `calculate_tsiolkovsky_general` | `delta_v`, `propellant_mass`, `mass_ratio` | km/s, kg, dimensionless |
| `calculate_orbital_period` | `period_hours`, `period_minutes` | hours, minutes |
| `calculate_orbital_velocity` | `velocity_km_s` | km/s |
| `calculate_bielliptic` | `delta_v1`, `delta_v2`, `delta_v3`, `total_delta_v`, `time_of_flight`, `hohmann_comparison` | km/s, km/s, km/s, km/s, hours, % savings vs Hohmann |
| `calculate_inclination_change` | `delta_v` | km/s |
| `calculate_combined_transfer` | `delta_v_transfer`, `delta_v_plane`, `total_delta_v`, `time_of_flight` | km/s, km/s, km/s, hours |

On error, all tools return `{"error": "<message>"}`.

## Design Notes

### Backend
- **Provider-agnostic loop**: `backend/core/agent_loop.py` drives any `LLMProvider` adapter through the same multi-turn tool-calling flow. Adapters only handle format translation.
- **Adapter interface** (`backend/llm/base.py`): `translate_tools`, `build_messages`, `generate`, `parse_tool_calls`, `extract_text`, `append_assistant_turn`, `append_tool_results`.
- **Automatic function calling is disabled**: every tool call is intercepted and emitted as a `tool_call` SSE event before dispatch, making invocations fully observable.
- **Agentic loop safety cap**: `max_tool_rounds = 5` (`backend/core/agent_loop.py`). The model can chain tools (e.g. `calculate_hohmann` → `calculate_tsiolkovsky_simple`) within this limit.
- **Blocking LLM calls are offloaded**: `asyncio.to_thread()` wraps each `provider.generate()` call so the FastAPI event loop is never blocked.
- **BYOK — keys never stored**: API key is read from the `X-API-Key` request header, used for the duration of the request only, and never persisted.
- **Input validation lives in Python, not C++**: `OrbitalEngine` methods in `point.py` validate types and physical sanity (e.g. `m0 > mf > 0`) before calling the DLL. The DLL assumes well-formed inputs.
- **Tool definitions are the single source of truth**: `TOOL_DEFINITIONS` in `backend/core/tools.py` is defined once. Each adapter's `translate_tools()` converts it to the provider-specific format (Gemini `FunctionDeclaration`, Claude `input_schema`, OpenAI `function` wrapper).
- **Provider-specific history injection**: Gemini uses `role="user"` + `Part.from_function_response`; Claude uses `role="user"` + `type="tool_result"` blocks keyed by `tool_use_id`; OpenAI uses `role="tool"` messages keyed by `tool_call_id`.
- **BYOK key validation**: `key_validation.py` checks key format prefixes before any LLM call and maps SDK auth exceptions to user-friendly messages. No key is ever stored.
- **Cross-platform engine**: `point.py` auto-detects OS and loads the correct shared library (`.dll`/`.so`/`.dylib`). `scripts/build_engine.sh` compiles for the current platform.
- **Status events**: `TOOL_STATUS_MESSAGES` in `tools.py` provides human-readable status strings emitted as `{"type": "status"}` events before each tool dispatch.
- **OpenAI-compatible providers**: Groq and OpenRouter reuse the OpenAI SDK with custom `base_url`. No additional Python dependencies required. Error classification falls through to the OpenAI SDK exception block in `key_validation.py`.

### Frontend
- **SSE via Fetch API (not EventSource)**: EventSource doesn't support POST or custom headers (`X-API-Key`). `client.ts` uses `response.body.getReader()` + `TextDecoder` to parse SSE lines.
- **Multi-part assistant messages**: Each assistant message contains an array of `MessagePart` (status, tool_call, tool_result, text, error). Parts render in order via `chat-message.tsx`.
- **State management (Zustand)**: Five small stores — `settings-store` (persisted to sessionStorage), `chat-store` (ephemeral), `ui-store` (layout toggles + activeView), `visualization-store` (active viz, view mode, fullscreen), `mission-store` (full wizard state, ephemeral). No Redux overhead.
- **API key security**: Keys stored in `sessionStorage` (cleared on tab close), never sent to any server except as `X-API-Key` to the ARIA backend.
- **Dark-only theme**: Aerospace-inspired oklch palette defined in `.dark {}` CSS block. `<html class="dark">` is set in `index.html`. shadcn components use CSS variable-based theming.
- **Responsive layout**: Sidebar becomes a `Sheet` drawer on mobile (`< 768px`). Right panel hidden on `< 1024px`. `useMediaQuery` hook handles breakpoints.
- **Error boundary**: `error-boundary.tsx` catches React crashes and displays the error with inline styles (no Tailwind dependency) so it's always visible.
- **Backend response unwrapping**: `models.ts` handles backend response shapes (`data.providers ?? data` for models, `data.engine === "loaded"` for health) to decouple frontend types from backend envelope formats.

### Mission Builder (Phase 4)
- **Pure frontend feature**: Mission builder chains existing `/api/calculate/hohmann` and `/api/calculate/tsiolkovsky_simple` — no new backend endpoints were needed.
- **Dual view mode**: `ui-store.ts` adds `activeView: "chat" | "mission"`. The header has a segmented toggle; the sidebar has a "New Mission" shortcut. `app-shell.tsx` conditionally renders `<ChatArea />` or `<MissionBuilder />`.
- **5-step wizard with validation gates**: Each step validates prerequisites before the "Next" button enables. Users can navigate backward freely but cannot skip forward.
- **ISP ↔ Exhaust Velocity toggle**: Step 3 lets users input either Isp (seconds) or Ve (km/s); `mission-math.ts` handles live bidirectional conversion (`Ve = Isp × g₀`).
- **Auto-calculation on step entry**: Steps 2 and 4 fire API calls automatically when their input dependencies are satisfied, giving an instant-feedback feel.
- **Feasibility check in client**: `computeFeasibility()` in `mission-math.ts` runs the Tsiolkovsky equation client-side to compare available vs. required ΔV, surfacing margin or deficit without an extra API round-trip.
- **D3 delta-v chart**: `delta-v-chart.tsx` renders a stacked bar comparing required (DV1 + DV2) against available ΔV, using D3 scales and SVG — no Recharts/Plotly dependency.
- **Phase 3 reuse**: The 2D SVG orbit viewer (`orbit-viewer-2d.tsx`) renders inline in Steps 2 and 5. The expand-to-fullscreen dialog reuses `orbit-viewer-dialog.tsx` unchanged.
- **Mission presets**: `mission-presets.ts` exports 4 `MissionPreset` objects (LEO→GEO, LEO→ISS, LEO→Moon simplified, Custom) and 4 `EnginePreset` objects (Merlin 1D 311s, RS-25 452s, RL-10 465s, Ion 3000s).
- **State lives in `mission-store.ts`**: Ephemeral Zustand store (not persisted). Downstream results (Hohmann, Tsiolkovsky) are cleared whenever mission inputs change.

### Visualization (Phase 3)
- **Client-side geometry**: All orbital geometry (semi-major axis, eccentricity, velocities) is derived in `orbital-math.ts` from input altitudes — no backend changes were needed.
- **Tool call/result pairing**: `chat-message.tsx` and `right-panel.tsx` scan backward through `MessagePart` arrays to find `tool_call` args matching a `tool_result`, enabling the visualization to access both input altitudes and computed results.
- **Three.js lazy loading**: `orbit-viewer-3d.tsx` is loaded via `React.lazy()` — Three.js (~700KB) only downloads when the user clicks the "3D" toggle. Vite automatically code-splits it into a separate chunk.
- **Extreme orbit ratio scaling**: When the outer/inner orbit ratio exceeds 10:1, `orbital-math.ts` applies sqrt scaling so both orbits remain visible, with a "Not to scale" notice.
- **2D always available, 3D desktop-only**: Mobile (`< 768px`) shows only the 2D SVG viewer. The 3D toggle appears on desktop.
- **Graceful fallback**: If `tool_call` args aren't available (e.g. WebSocket mode), the original `HohmannResultCard` renders without visualization.

### Expanded Physics Engine (Phase 5)
- **Five new orbital calculations**: Orbital period, vis-viva velocity, bi-elliptic transfer, inclination change, combined plane change + transfer. Each implemented in C++, exposed via ctypes, with backend tools, and frontend result cards.
- **Bi-elliptic visualization**: 2D/3D viewers render both intermediate and final orbits with all three burn points (intermediate and final apoapsis/periapsis burns). Hohmann comparison shows efficiency delta.
- **Inclination change visualization**: 3D-required visualization (2D cannot meaningfully show plane changes). Shows pre- and post-change orbits with 3D inclination angle visualization.
- **Combined plane change + transfer**: Shows the optimal split between in-plane (Hohmann) and out-of-plane (inclination) burns at apoapsis, with both components visible in 2D and 3D.
- **Tool result cards**: New result cards for each calculation (`orbital-period-result.tsx`, `orbital-velocity-result.tsx`, `bielliptic-result.tsx`, `inclination-result.tsx`, `combined-transfer-result.tsx`) registered in `tool-result-card.tsx` router.
- **Right-panel grouping**: Tool results grouped by category in right panel (transfer maneuvers, orbital parameters, etc.) via `right-panel.tsx`.

### Deployment & Polish (Phase 6)
- **Single-container deployment**: FastAPI serves the built frontend via `StaticFiles(html=True)` when `frontend/dist` exists. In dev mode, falls back to `/docs` redirect. Vite proxy handles dev routing.
- **Multi-stage Dockerfile**: Three stages — Node.js frontend build, C++ engine compile (g++), slim Python runtime. Final image has no compiler toolchain or Node.js.
- **Configurable CORS**: `ALLOWED_ORIGINS` env var (comma-separated, defaults to `"*"`). Set to deployed domain in production.
- **Test suite**: 25 pytest tests — 17 physics engine tests (all 8 calculation methods with known values + error cases) and 8 API endpoint tests (health, models, calculate, error handling). No LLM key required.
- **GitHub Actions CI**: Two parallel jobs — backend (ruff lint + C++ build + pytest) and frontend (ESLint + TypeScript build). Runs on push to main and PRs.
- **Welcome screen with onboarding**: `welcome-screen.tsx` replaces static empty state with BYOK explanation, free-tier provider suggestions, and 4 clickable example prompt cards. Clicking a card populates the chat input via `pendingPrompt` in `chat-store.ts`.
- **Documentation**: Professional README with badges and architecture diagram, MIT license, CONTRIBUTING.md, `.env.example`.

## Additional Documentation

- `.claude/docs/architectural_patterns.md` — FFI bridge design, agentic loop, tool chaining, conversation history management, and dispatcher pattern.
