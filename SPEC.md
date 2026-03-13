# ARIA v2 — Project Specification



## Project Vision

ARIA (Aerospace Reasoning & Intelligence Agent) evolves from a CLI-based agent into a **deployed, polished web application** where users can ask aerospace engineering questions, run high-precision orbital calculations, visualize trajectories, and build multi-step mission plans — all through an AI agent backed by a C++ physics engine.

The project serves two goals:
1. **Learning**: AI agent architecture, full-stack development, FFI patterns, deployment
2. **Portfolio**: A GitHub showpiece that demonstrates agent design, physics engineering, product thinking, and frontend craft

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌───────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Chat UI   │ │ Orbit Viewer │ │ Mission Builder│  │
│  │ (streaming)│ │ (2D + 3D)   │ │ (wizard flow) │  │
│  └─────┬─────┘ └──────┬───────┘ └───────┬────────┘  │
│        └───────────────┼─────────────────┘           │
│                        │ REST / WebSocket             │
├────────────────────────┼─────────────────────────────┤
│                   FastAPI Backend                     │
│  ┌──────────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ LLM Adapter  │ │ Tool Engine│ │ Session Manager│  │
│  │ (multi-prov) │ │ (ctypes)   │ │                │  │
│  └──────┬───────┘ └─────┬──────┘ └────────────────┘  │
│         │               │                             │
│    ┌────┴────┐    ┌─────┴──────┐                     │
│    │ Gemini  │    │orbital.dll │                      │
│    │ Claude  │    │ / .so      │                      │
│    │ OpenAI  │    └────────────┘                      │
│    └─────────┘                                        │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | FastAPI | Async-native, great for streaming, easy to learn |
| Physics engine hosting | Server-side via ctypes (Phase 1), WASM client-side (Phase 3) | Ship fast, optimize later |
| LLM integration | Multi-provider with BYOK | User brings their own API key; no hosting cost |
| Frontend framework | React | Industry standard, rich ecosystem for viz |
| Visualization | Plotly/D3 (2D) + Three.js (3D) | 2D for quick analysis, 3D for wow factor |
| Deployment | Docker + cloud provider (Railway/Render/Fly.io) | Simple for first deployment |
| Language | English only | Keeps scope manageable |

---

## Phased Implementation Plan

### Phase 1 — Backend API + LLM Abstraction Layer
**Goal**: Replace the CLI with a proper API that the frontend can consume.

#### 1.1 FastAPI Server
- `POST /api/chat` — Send a message, receive streamed AI response
- `POST /api/calculate/{tool_name}` — Direct engine access (bypass LLM)
- `GET /api/models` — List available LLM providers
- `GET /api/health` — Health check
- WebSocket endpoint for real-time streaming responses

#### 1.2 LLM Abstraction Layer
Create a provider-agnostic interface so the agent works with any LLM:

```
llm/
  base.py          — Abstract base class: LLMProvider
  gemini.py        — Google Gemini adapter
  claude.py        — Anthropic Claude adapter
  openai.py        — OpenAI adapter
  registry.py      — Provider registry + factory
```

Each adapter must implement:
- `stream_response(messages, tools) -> AsyncGenerator[str]`
- `translate_tools(tool_defs) -> provider-specific format`
- `parse_tool_call(response) -> standardized ToolCall`
- `format_tool_result(result) -> provider-specific format`

**Critical**: Tool definitions (Hohmann, Tsiolkovsky, etc.) should be defined ONCE in a provider-agnostic format, then translated per-provider by each adapter.

#### 1.3 BYOK (Bring Your Own Key) System
- Frontend sends API key in request header (never stored server-side)
- Backend validates key format before first LLM call
- Keys are held in memory only for the duration of the request
- Clear error messages when key is invalid or expired

#### 1.4 Refactor Engine for Cross-Platform
- Compile `orbital.dll` as `.so` for Linux (required for deployment)
- Update `point.py` to detect OS and load the correct library
- Add build script: `scripts/build_engine.sh`
- Add Dockerfile that compiles C++ at build time

#### 1.5 Agentic Loop Migration
- Port the existing agentic loop from `agent.py` to the FastAPI context
- Support tool chaining (Hohmann → Tsiolkovsky) within a single request
- Stream intermediate status ("Calculating transfer...", "Computing propellant...") to frontend

**Definition of Done (Phase 1)**:
- `curl` can send a message and receive a streamed response
- Tool calls work through the API with at least 2 LLM providers
- Engine compiles and runs on Linux
- Docker container builds and runs locally

---

### Phase 2 — React Frontend (Core)
**Goal**: A polished chat interface with real-time streaming.

#### 2.1 Project Setup
- React + TypeScript + Vite
- Tailwind CSS for styling
- Component library: shadcn/ui (professional, customizable)

#### 2.2 Layout & Design Direction
- **Dark theme primary** (aerospace aesthetic — think mission control)
- Sidebar: model selector, API key input, conversation history
- Main area: chat interface with message bubbles
- Right panel (collapsible): calculation results, visualizations

#### 2.3 Chat Interface
- Streaming response display (token by token)
- Tool call indicators ("🔧 Running Hohmann transfer calculation...")
- Calculation result cards (formatted, not raw JSON)
- Markdown rendering for AI responses
- Code block syntax highlighting (for when ARIA explains equations)

#### 2.4 API Key Management (Frontend)
- Input fields per provider (Gemini, Claude, OpenAI)
- Keys stored in browser memory only (sessionStorage) — cleared on tab close
- Visual indicator: which provider is active
- "Test connection" button per provider

#### 2.5 Model Selector
- Dropdown grouped by provider
- Show model capabilities (e.g., "supports tool use", "supports streaming")
- Remember last selection (localStorage)

**Definition of Done (Phase 2)**:
- User can enter an API key, select a model, and chat with ARIA
- Responses stream in real time
- Tool calls display with results formatted as cards
- UI looks professional — dark theme, clean typography, responsive

---

### Phase 3 — Orbit Visualization
**Goal**: Interactive 2D and 3D orbit visualizations.

#### 3.1 2D Orbit Viewer (Plotly/D3)
- Earth at center with scale reference
- Circular orbits drawn as rings (origin + destination)
- Transfer ellipse highlighted with different color
- Burn points marked (ΔV1 at departure, ΔV2 at arrival)
- Annotations: altitude labels, velocity values at key points
- Toggle: show/hide orbital parameters panel

#### 3.2 3D Orbit Viewer (Three.js)
- Textured Earth sphere (NASA Blue Marble texture)
- Orbits as 3D rings around Earth
- Transfer trajectory as animated arc
- Camera controls: orbit, zoom, pan
- Satellite marker that animates along the transfer path
- Optional: starfield background

#### 3.3 Integration with Chat
- When ARIA performs a Hohmann calculation, automatically render the visualization
- User can toggle between 2D and 3D views
- Visualization updates reactively when parameters change
- "Full screen" mode for the viewer

**Definition of Done (Phase 3)**:
- Hohmann transfer results render as both 2D plot and 3D scene
- 3D viewer has smooth camera controls and animated transfer
- Visualizations are triggered automatically from chat calculations

---

### Phase 4 — Mission Builder
**Goal**: A guided wizard that chains calculations into a complete mission plan.

#### 4.1 Wizard Flow
Step 1: **Define Mission** — Origin orbit, destination orbit, mission name
Step 2: **Transfer Analysis** — Auto-run Hohmann, display ΔV budget
Step 3: **Spacecraft Config** — Dry mass, engine Isp (or exhaust velocity), propellant capacity
Step 4: **Propellant Analysis** — Auto-run Tsiolkovsky, show fuel requirements
Step 5: **Mission Summary** — Complete dashboard with all parameters, visualizations, feasibility check

#### 4.2 Mission Dashboard
- Summary card with all key metrics
- ΔV budget breakdown (pie chart or bar chart)
- Orbit visualization (reuse Phase 3 viewer)
- Feasibility indicator: "✅ Mission feasible" or "⚠️ Insufficient ΔV — need X kg more propellant"
- Export as PDF (stretch goal)

#### 4.3 Mission Presets
- LEO → GEO (classic comsat deployment)
- LEO → ISS rendezvous (340 → 420 km)
- LEO → Moon transfer (placeholder — simplified)
- Custom (user defines everything)

**Definition of Done (Phase 4)**:
- User can complete the wizard and get a full mission analysis
- Mission builder chains Hohmann + Tsiolkovsky automatically
- Results display in a dashboard with charts and visualization
- At least 3 presets work out of the box

---

### Phase 5 — Expanded Physics Engine
**Goal**: Add more calculations to the C++ engine.

#### 5.1 New Calculations (prioritized)
1. **Orbital period** — T = 2π * sqrt(a³/μ) — simple but useful everywhere
2. **Orbital velocity at any point** — vis-viva equation for elliptical orbits
3. **Bi-elliptic transfer** — for when it's more efficient than Hohmann (r2/r1 > 11.94)
4. **Bi-elliptic transfer visualization** — ARIA can generate vizualizations both in 2d and 3d for Bi-elliptic transfers in the same way that it can generate for Hohmann transfers. 
5. **Inclination change** — ΔV = 2v * sin(Δi/2) — plane change maneuver
6. **Combined plane change + transfer** — optimal split between in-plane and out-of-plane burns

#### 5.2 Implementation Pattern (per calculation)
For each new calculation, follow the existing pattern:
1. Add struct + method to `orbital_mechanics.cpp`
2. Add `extern "C"` export function
3. Rebuild shared library
4. Add ctypes struct mirror + wrapper method in `point.py`
5. Add tool declaration + dispatch branch in agent (now in the backend)
6. Add unit test
7. Update system prompt with new tool description

#### 5.3 Visualization Extensions
- Bi-elliptic transfer: show both intermediate and final orbits
- Inclination change: 3D required (2D can't show plane changes meaningfully)
- Orbital period: add time annotations to orbit viewer

**Definition of Done (Phase 5)**:
- At least 3 new calculations implemented end-to-end
- Each has unit tests passing
- ARIA correctly selects the new tools based on user questions
- Visualizations update to support new transfer types

---

### Phase 6 — Deployment & Polish
**Goal**: ARIA is live, documented, and portfolio-ready.

#### 6.1 Deployment
- Dockerfile: multi-stage build (C++ compile → Python runtime → serve)
- Deploy to Railway, Render, or Fly.io (all support Docker)
- Environment: no secrets needed server-side (BYOK model)
- Add CORS configuration for frontend domain
- Health check endpoint for uptime monitoring

#### 6.2 GitHub Polish
- Professional README with:
  - Hero screenshot/GIF of the interface
  - Architecture diagram
  - "Try it live" link
  - Local setup instructions
  - Tech stack badges
- Contributing guide (even if solo — shows professionalism)
- License (MIT recommended)
- GitHub Actions: lint, test, build on PR

#### 6.3 Landing / Demo
- Simple landing page explaining what ARIA does (can be the app itself with good onboarding)
- First-time user flow: explain BYOK, offer a demo mode with limited features
- Example prompts the user can click to try

**Definition of Done (Phase 6)**:
- ARIA is deployed and accessible via URL
- README has screenshots, architecture diagram, live link
- CI pipeline runs tests on every push
- A first-time user can understand and use ARIA within 60 seconds

---

## Future Possibilities (Out of Scope for v2)

These are ideas for after ARIA v2 is "done". Not committed, just documented:
- WebAssembly migration (move physics to client-side)
- Interplanetary transfers (patched conics, Lambert's problem)
- Launch window calculator (synodic periods, planetary positions)
- Multi-body simulation (numerical orbit propagation)
- Collaborative missions (shareable mission links)
- Real satellite TLE data integration (track real spacecraft)

---

## Technical Constraints & Risks

| Risk | Mitigation |
|------|-----------|
| C++ compilation on Linux (currently Windows DLL only) | Test early in Phase 1; use Docker for consistent builds |
| LLM tool-calling format differs per provider | Abstract early; test with at least 2 providers before building frontend |
| Three.js performance with complex scenes | Keep polygon count low; LOD for Earth texture; test on mobile |
| BYOK key security | Never store keys; transmit over HTTPS only; clear from memory after request |
| Streaming differences across LLM providers | Normalize to SSE (Server-Sent Events) at the API layer |
| Scope creep | This spec IS the scope. If it's not in a phase, it waits. |

---