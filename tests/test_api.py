"""Tests for the FastAPI endpoints (no LLM key required)."""


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["engine"] == "loaded"


def test_models(client):
    r = client.get("/api/models")
    assert r.status_code == 200
    data = r.json()
    assert "providers" in data
    assert len(data["providers"]) > 0


def test_calculate_hohmann(client):
    r = client.post("/api/calculate/hohmann", json={
        "origin_km": 200,
        "destination_km": 35786,
    })
    assert r.status_code == 200
    data = r.json()
    assert "total_delta_v" in data
    assert 3.90 < data["total_delta_v"] < 3.98


def test_calculate_hohmann_invalid(client):
    r = client.post("/api/calculate/hohmann", json={})
    assert r.status_code == 422


def test_calculate_orbital_period(client):
    r = client.post("/api/calculate/orbital_period", json={
        "altitude_km": 35786,
    })
    assert r.status_code == 200
    data = r.json()
    assert "period_hours" in data
    assert 23.8 < data["period_hours"] < 24.1


def test_calculate_tsiolkovsky(client):
    r = client.post("/api/calculate/tsiolkovsky_simple", json={
        "ve_km_s": 3.0,
        "mass_initial_kg": 10000,
        "mass_final_kg": 4000,
    })
    assert r.status_code == 200
    data = r.json()
    assert "delta_v" in data


def test_calculate_unknown_tool(client):
    r = client.post("/api/calculate/nonexistent", json={})
    assert r.status_code == 404


def test_chat_no_api_key(client):
    r = client.post("/api/chat", json={
        "message": "Hello",
        "history": [],
        "model": "gemini-2.5-flash",
        "provider": "gemini",
    })
    # Should fail gracefully without a valid API key
    assert r.status_code in (200, 400, 401, 422)
