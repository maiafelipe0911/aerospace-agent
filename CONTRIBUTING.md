# Contributing to ARIA

Thanks for your interest in ARIA! Here's how to get set up.

## Development Setup

### Prerequisites

- Python 3.12+
- Node.js 22+
- g++ (for compiling the physics engine)

### Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Build the C++ physics engine
bash scripts/build_engine.sh

# Start the API server
python -m uvicorn backend.main:app --reload --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server starts at `http://localhost:5173` and proxies API requests to `http://localhost:8080`.

### API Keys

Copy `.env.example` to `key.env` and fill in at least one API key. ARIA uses BYOK (Bring Your Own Key) — keys are only used for the duration of a request and never stored.

## Running Tests

```bash
# Backend tests (requires compiled physics engine)
pytest tests/ -v

# Frontend lint + typecheck
cd frontend && npm run lint && npm run build
```

## Code Style

- **Python**: [ruff](https://docs.astral.sh/ruff/) — run `ruff check backend/ point.py`
- **TypeScript**: ESLint — run `cd frontend && npm run lint`

## Adding a New Physics Calculation

See the "Adding a New Tool" section in `CLAUDE.md` for the full checklist. In short:

1. Implement in `orbital_mechanics.cpp` and rebuild the DLL
2. Add ctypes wrapper in `point.py`
3. Add tool definition + dispatch in `backend/core/tools.py`
4. Add TypeScript types in `frontend/src/api/types.ts`
5. Add a result card component in `frontend/src/components/tools/`

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Run both backend tests and frontend lint before submitting
- Include a brief description of what changed and why
