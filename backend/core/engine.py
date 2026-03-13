import sys
import os

# Add project root to path so point.py can be found when running as a package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from point import OrbitalEngine

_engine: OrbitalEngine | None = None
_engine_error: str | None = None


def load_engine() -> None:
    global _engine, _engine_error
    try:
        _engine = OrbitalEngine()
        _engine_error = None
        print("[engine] OrbitalEngine loaded successfully.")
    except Exception as e:
        _engine = None
        _engine_error = str(e)
        print(f"[engine] WARNING: OrbitalEngine failed to load: {e}")
        print("[engine] Run 'bash scripts/build_engine.sh' to compile for your platform.")


def get_engine() -> OrbitalEngine | None:
    return _engine


def get_engine_status() -> dict:
    if _engine is not None:
        return {"engine": "loaded"}
    return {"engine": "error", "detail": _engine_error}
