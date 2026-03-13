"""Tests for the C++ physics engine via the OrbitalEngine Python wrapper."""
import pytest


# ── Hohmann Transfer ─────────────────────────────────────────────────────────

def test_hohmann_leo_to_geo(engine):
    r = engine.calculate_transfer(200, 35786)
    assert "error" not in r
    assert 3.90 < r["total_delta_v"] < 3.98
    assert r["time_of_flight"] > 0

def test_hohmann_same_altitude(engine):
    r = engine.calculate_transfer(400, 400)
    assert "error" not in r
    assert abs(r["total_delta_v"]) < 0.001

def test_hohmann_negative_altitude(engine):
    r = engine.calculate_transfer(-100, 400)
    assert "error" in r


# ── Simple Tsiolkovsky ───────────────────────────────────────────────────────

def test_tsiolkovsky_simple_known(engine):
    # ve=3.0 km/s, m0=10000 kg, mf=4000 kg → ΔV = 3.0 * ln(2.5) ≈ 2.748
    r = engine.calculate_tsiolkovsky_simple(3.0, 10000, 4000)
    assert "error" not in r
    assert 2.74 < r["delta_v"] < 2.76
    assert r["propellant_mass"] == pytest.approx(6000.0, abs=1)
    assert r["mass_ratio"] == pytest.approx(2.5, abs=0.01)

def test_tsiolkovsky_simple_invalid_mass(engine):
    r = engine.calculate_tsiolkovsky_simple(3.0, 4000, 10000)
    assert "error" in r


# ── General Tsiolkovsky ──────────────────────────────────────────────────────

def test_tsiolkovsky_general_constant_ve(engine):
    """When ve_initial == ve_final, general should match simple."""
    simple = engine.calculate_tsiolkovsky_simple(3.0, 10000, 4000)
    general = engine.calculate_tsiolkovsky_general(3.0, 3.0, 10000, 4000)
    assert "error" not in general
    assert general["delta_v"] == pytest.approx(simple["delta_v"], rel=0.01)


# ── Orbital Period ───────────────────────────────────────────────────────────

def test_orbital_period_geo(engine):
    r = engine.calculate_orbital_period(35786)
    assert "error" not in r
    assert 23.8 < r["period_hours"] < 24.1

def test_orbital_period_iss(engine):
    r = engine.calculate_orbital_period(408)
    assert "error" not in r
    period_minutes = r["period_seconds"] / 60
    assert 92 < period_minutes < 93

def test_orbital_period_negative(engine):
    r = engine.calculate_orbital_period(-100)
    assert "error" in r


# ── Orbital Velocity (Vis-Viva) ──────────────────────────────────────────────

def test_orbital_velocity_circular_iss(engine):
    r_iss = 408 + 6371.0
    r = engine.calculate_orbital_velocity(r_iss, r_iss)
    assert "error" not in r
    assert 7.6 < r["velocity"] < 7.7

def test_orbital_velocity_below_earth(engine):
    r = engine.calculate_orbital_velocity(5000, 7000)
    assert "error" in r


# ── Bi-Elliptic Transfer ─────────────────────────────────────────────────────

def test_bielliptic_has_hohmann_comparison(engine):
    r = engine.calculate_bielliptic(200, 500000, 1000000)
    assert "error" not in r
    assert "hohmann_delta_v" in r
    assert "efficiency_gain" in r
    assert r["total_delta_v"] > 0

def test_bielliptic_intermediate_too_low(engine):
    r = engine.calculate_bielliptic(200, 35786, 100)
    assert "error" in r


# ── Inclination Change ───────────────────────────────────────────────────────

def test_inclination_change_geo(engine):
    r = engine.calculate_inclination_change(35786, 28.5)
    assert "error" not in r
    assert 1.5 < r["delta_v"] < 2.0

def test_inclination_change_invalid(engine):
    r = engine.calculate_inclination_change(400, 0)
    assert "error" in r


# ── Combined Transfer ────────────────────────────────────────────────────────

def test_combined_transfer_leo_geo(engine):
    r = engine.calculate_combined_transfer(200, 35786, 28.5)
    assert "error" not in r
    assert r["total_delta_v"] > 0
    assert r["savings_vs_separate"] > 0

def test_combined_transfer_cheaper_than_separate(engine):
    r = engine.calculate_combined_transfer(200, 35786, 28.5)
    assert "error" not in r
    assert r["total_delta_v"] < r["separate_delta_v"]
