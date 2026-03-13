# ARIA — Aerospace Reasoning & Intelligence Agent

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![C++](https://img.shields.io/badge/C++-Physics_Engine-00599C?logo=cplusplus)](https://isocpp.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An AI-powered aerospace engineering assistant that answers questions about orbital mechanics and rocket propulsion. A multi-provider LLM acts as the reasoning layer; all numerical calculations are delegated to a high-precision C++ physics engine. Users interact through a dark-themed, mission-control-inspired web UI.

<!-- TODO: Add hero screenshot
![ARIA Screenshot](docs/screenshot.png)
-->

## Features

- **8 physics calculations** — Hohmann transfer, Tsiolkovsky equation (simple & general), orbital period, vis-viva velocity, bi-elliptic transfer, inclination change, combined plane change + transfer
- **C++ physics engine** — High-precision calculations via a compiled shared library, bridged to Python via ctypes FFI
- **5 LLM providers** — Gemini, Claude, OpenAI, Groq, OpenRouter — all through a single provider-agnostic interface
- **2D & 3D orbit visualization** — SVG orbit diagrams and React Three Fiber 3D scenes with animated transfers
- **Mission Builder** — 5-step guided wizard that chains calculations into a complete mission plan with feasibility analysis
- **BYOK security** — Bring Your Own Key: API keys stay in your browser (sessionStorage), never stored server-side

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  ┌───────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Chat UI   │ │ Orbit Viewer │ │ Mission Builder│  │
│  │ (streaming)│ │ (2D + 3D)   │ │ (wizard flow) │  │
│  └─────┬─────┘ └──────┬───────┘ └───────┬────────┘  │
│        └───────────────┼─────────────────┘           │
│                        │ REST / SSE / WebSocket       │
├────────────────────────┼─────────────────────────────┤
│                   FastAPI Backend                     │
│  ┌──────────────┐ ┌────────────┐                     │
│  │ LLM Adapters │ │ Tool Engine│                     │
│  │ (5 providers)│ │ (ctypes)   │                     │
│  └──────┬───────┘ └─────┬──────┘                     │
│         │               │                            │
│    ┌────┴────┐    ┌─────┴──────┐                     │
│    │ Gemini  │    │orbital.dll │                      │
│    │ Claude  │    │ / .so      │                      │
│    │ OpenAI  │    └────────────┘                      │
│    │ Groq    │                                        │
│    │OpenRouter│                                       │
│    └─────────┘                                        │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 22+
- g++ (for compiling the C++ physics engine)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/aria.git
cd aria

# Copy environment template
cp .env.example key.env
# Edit key.env and add at least one API key

# Build the C++ physics engine
bash scripts/build_engine.sh
```

### Run (two terminals)

```bash
# Terminal 1 — Backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8080

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Docker

```bash
docker build -t aria .
docker run -p 8080:8080 aria
```

Open `http://localhost:8080`. The container serves both the API and the frontend.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, D3, React Three Fiber |
| LLM | Gemini, Claude, OpenAI, Groq, OpenRouter (provider-agnostic adapter layer) |
| Backend API | FastAPI + uvicorn |
| Physics Engine | C++ (compiled to shared library via ctypes FFI) |
| CI | GitHub Actions (Python lint + pytest, frontend lint + build) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Engine status |
| `GET` | `/api/models` | Available providers and models |
| `POST` | `/api/chat` | SSE-streamed agentic chat (header: `X-API-Key`) |
| `WS` | `/ws/chat` | WebSocket chat |
| `POST` | `/api/calculate/hohmann` | Hohmann transfer |
| `POST` | `/api/calculate/tsiolkovsky_simple` | Simple Tsiolkovsky equation |
| `POST` | `/api/calculate/tsiolkovsky_general` | General Tsiolkovsky equation |
| `POST` | `/api/calculate/orbital_period` | Orbital period |
| `POST` | `/api/calculate/orbital_velocity` | Vis-viva velocity |
| `POST` | `/api/calculate/bielliptic` | Bi-elliptic transfer |
| `POST` | `/api/calculate/inclination_change` | Plane change maneuver |
| `POST` | `/api/calculate/combined_transfer` | Hohmann + plane change |

Interactive API docs available at `/docs` when running the backend.

## Testing

```bash
# Backend tests (requires compiled physics engine)
pytest tests/ -v

# Frontend lint + typecheck
cd frontend && npm run lint && npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
