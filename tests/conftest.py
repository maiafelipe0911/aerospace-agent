import pytest
from point import OrbitalEngine


@pytest.fixture(scope="session")
def engine():
    """Shared OrbitalEngine instance (loads the DLL once)."""
    try:
        return OrbitalEngine()
    except (FileNotFoundError, OSError) as e:
        pytest.skip(f"Physics engine not available: {e}")


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient (imports app, which loads the engine)."""
    from fastapi.testclient import TestClient
    from backend.main import app
    with TestClient(app) as c:
        yield c
