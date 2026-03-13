import ctypes
import os
import platform

# ---------------------------------------------------------------------------
# C Struct Mirrors
# These must exactly match the structs defined in orbital_mechanics.cpp
# ---------------------------------------------------------------------------

class TransferResult(ctypes.Structure):
    _fields_ = [
        ("delta_v1",       ctypes.c_double),
        ("delta_v2",       ctypes.c_double),
        ("total_delta_v",  ctypes.c_double),
        ("time_of_flight", ctypes.c_double),
    ]

class TsiolkovskyResult(ctypes.Structure):
    _fields_ = [
        ("delta_v",         ctypes.c_double),
        ("propellant_mass", ctypes.c_double),
        ("mass_ratio",      ctypes.c_double),
    ]

class OrbitalPeriodResult(ctypes.Structure):
    _fields_ = [
        ("period_seconds",    ctypes.c_double),
        ("period_hours",      ctypes.c_double),
        ("semi_major_axis",   ctypes.c_double),
        ("orbital_velocity",  ctypes.c_double),
    ]

class OrbitalVelocityResult(ctypes.Structure):
    _fields_ = [
        ("velocity",           ctypes.c_double),
        ("semi_major_axis",    ctypes.c_double),
        ("radius",             ctypes.c_double),
        ("escape_velocity",    ctypes.c_double),
        ("circular_velocity",  ctypes.c_double),
    ]

class BiEllipticResult(ctypes.Structure):
    _fields_ = [
        ("delta_v1",            ctypes.c_double),
        ("delta_v2",            ctypes.c_double),
        ("delta_v3",            ctypes.c_double),
        ("total_delta_v",       ctypes.c_double),
        ("time_of_flight",      ctypes.c_double),
        ("time_transfer1",      ctypes.c_double),
        ("time_transfer2",      ctypes.c_double),
        ("intermediate_radius", ctypes.c_double),
        ("hohmann_delta_v",     ctypes.c_double),
        ("efficiency_gain",     ctypes.c_double),
    ]

class InclinationChangeResult(ctypes.Structure):
    _fields_ = [
        ("delta_v",                 ctypes.c_double),
        ("inclination_change_deg",  ctypes.c_double),
        ("orbital_velocity",        ctypes.c_double),
        ("optimal_altitude",        ctypes.c_double),
    ]

class CombinedTransferResult(ctypes.Structure):
    _fields_ = [
        ("delta_v1",                  ctypes.c_double),
        ("delta_v2",                  ctypes.c_double),
        ("total_delta_v",             ctypes.c_double),
        ("time_of_flight",            ctypes.c_double),
        ("inclination_change_deg",    ctypes.c_double),
        ("plane_change_at_apoapsis",  ctypes.c_double),
        ("hohmann_only_delta_v",      ctypes.c_double),
        ("separate_delta_v",          ctypes.c_double),
        ("savings_vs_separate",       ctypes.c_double),
    ]

# ---------------------------------------------------------------------------
# Orbital Engine — Python wrapper around the C++ DLL
# ---------------------------------------------------------------------------

class OrbitalEngine:
    def __init__(self):
        self.lib = self._load_library()
        self._configure_function_signatures()

    def _load_library(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        system = platform.system()

        if system == "Windows":
            lib_name = "orbital.dll"
        elif system == "Linux":
            lib_name = "liborbital.so"
        elif system == "Darwin":
            lib_name = "liborbital.dylib"
        else:
            raise OSError(f"Unsupported platform: {system}")

        lib_path = os.path.join(current_dir, lib_name)

        if not os.path.exists(lib_path):
            raise FileNotFoundError(
                f"Engine library not found at: {lib_path}\n"
                f"Run 'bash scripts/build_engine.sh' to compile for your platform."
            )

        try:
            return ctypes.CDLL(lib_path)
        except OSError as e:
            print(f"Error loading {lib_name}. Check architecture (64 vs 32 bit).")
            raise e

    # Expected DLL version — increment when rebuilding
    EXPECTED_ENGINE_VERSION = 2

    def _configure_function_signatures(self):
        # Hohmann transfer
        self.lib.calculate_hohmann.argtypes = [ctypes.c_double, ctypes.c_double]
        self.lib.calculate_hohmann.restype  = TransferResult

        # Simple Tsiolkovsky (constant ve)
        self.lib.calculate_tsiolkovsky_simple.argtypes = [
            ctypes.c_double,  # ve_km_s
            ctypes.c_double,  # mass_initial_kg
            ctypes.c_double,  # mass_final_kg
        ]
        self.lib.calculate_tsiolkovsky_simple.restype = TsiolkovskyResult

        # General Tsiolkovsky (variable ve, numerical integration)
        self.lib.calculate_tsiolkovsky_general.argtypes = [
            ctypes.c_double,  # ve_initial_km_s
            ctypes.c_double,  # ve_final_km_s
            ctypes.c_double,  # mass_initial_kg
            ctypes.c_double,  # mass_final_kg
        ]
        self.lib.calculate_tsiolkovsky_general.restype = TsiolkovskyResult

        # Orbital period
        self.lib.calculate_orbital_period.argtypes = [ctypes.c_double]
        self.lib.calculate_orbital_period.restype = OrbitalPeriodResult

        # Orbital velocity (vis-viva)
        self.lib.calculate_orbital_velocity.argtypes = [
            ctypes.c_double,  # radius_km (from Earth's center)
            ctypes.c_double,  # semi_major_axis_km (from Earth's center)
        ]
        self.lib.calculate_orbital_velocity.restype = OrbitalVelocityResult

        # Bi-elliptic transfer
        self.lib.calculate_bielliptic.argtypes = [
            ctypes.c_double,  # alt_initial_km
            ctypes.c_double,  # alt_final_km
            ctypes.c_double,  # alt_intermediate_km
        ]
        self.lib.calculate_bielliptic.restype = BiEllipticResult

        # Inclination change
        self.lib.calculate_inclination_change.argtypes = [
            ctypes.c_double,  # altitude_km
            ctypes.c_double,  # inclination_deg
        ]
        self.lib.calculate_inclination_change.restype = InclinationChangeResult

        # Combined transfer (Hohmann + plane change)
        self.lib.calculate_combined_transfer.argtypes = [
            ctypes.c_double,  # alt_initial_km
            ctypes.c_double,  # alt_final_km
            ctypes.c_double,  # inclination_deg
        ]
        self.lib.calculate_combined_transfer.restype = CombinedTransferResult

        # Engine version
        self.lib.engine_version.argtypes = []
        self.lib.engine_version.restype = ctypes.c_int

        # Version check
        try:
            version = self.lib.engine_version()
            if version != self.EXPECTED_ENGINE_VERSION:
                print(f"WARNING: orbital engine version {version} does not match "
                      f"expected version {self.EXPECTED_ENGINE_VERSION}. "
                      f"Rebuild with: bash scripts/build_engine.sh")
        except AttributeError:
            print("WARNING: orbital engine does not export engine_version(). "
                  "Rebuild with: bash scripts/build_engine.sh")

    # -----------------------------------------------------------------------
    # Public Methods — called by the AI agent
    # -----------------------------------------------------------------------

    def calculate_transfer(self, alt_origem_km, alt_destino_km) -> dict:
        """Hohmann transfer between two circular orbits."""
        try:
            o_km = float(alt_origem_km)
            d_km = float(alt_destino_km)
        except ValueError:
            return {"error": "Altitudes must be valid numbers."}

        if o_km < 0 or d_km < 0:
            return {"error": "Altitude cannot be negative — an orbit below Earth's surface is physically impossible."}

        r = self.lib.calculate_hohmann(o_km, d_km)
        return {
            "delta_v1":       r.delta_v1,
            "delta_v2":       r.delta_v2,
            "total_delta_v":  r.total_delta_v,
            "time_of_flight": r.time_of_flight,
        }

    def calculate_tsiolkovsky_simple(self, ve_km_s,
                                      mass_initial_kg,
                                      mass_final_kg) -> dict:
        """
        Simple Tsiolkovsky equation with constant exhaust velocity.
        ΔV = ve * ln(m0 / mf)
        """
        try:
            ve   = float(ve_km_s)
            m0   = float(mass_initial_kg)
            mf   = float(mass_final_kg)
        except ValueError:
            return {"error": "All inputs must be valid numbers."}

        if mf <= 0 or m0 <= mf:
            return {"error": "Initial mass must be greater than final mass, and final mass must be positive."}

        r = self.lib.calculate_tsiolkovsky_simple(ve, m0, mf)
        return {
            "delta_v":         r.delta_v,
            "propellant_mass": r.propellant_mass,
            "mass_ratio":      r.mass_ratio,
        }

    def calculate_tsiolkovsky_general(self, ve_initial_km_s,
                                       ve_final_km_s,
                                       mass_initial_kg,
                                       mass_final_kg) -> dict:
        """
        General Tsiolkovsky equation with linearly varying exhaust velocity.
        ΔV = integral of ve(m)/m dm, solved via Simpson's rule.
        """
        try:
            ve0 = float(ve_initial_km_s)
            vef = float(ve_final_km_s)
            m0  = float(mass_initial_kg)
            mf  = float(mass_final_kg)
        except ValueError:
            return {"error": "All inputs must be valid numbers."}

        if mf <= 0 or m0 <= mf:
            return {"error": "Initial mass must be greater than final mass, and final mass must be positive."}

        r = self.lib.calculate_tsiolkovsky_general(ve0, vef, m0, mf)
        return {
            "delta_v":         r.delta_v,
            "propellant_mass": r.propellant_mass,
            "mass_ratio":      r.mass_ratio,
        }

    R_EARTH = 6371.0

    def calculate_orbital_period(self, altitude_km) -> dict:
        """Orbital period for a circular orbit at given altitude."""
        try:
            alt = float(altitude_km)
        except ValueError:
            return {"error": "Altitude must be a valid number."}
        if alt < 0:
            return {"error": "Altitude cannot be negative."}

        r = self.lib.calculate_orbital_period(alt)
        return {
            "period_seconds":   r.period_seconds,
            "period_hours":     r.period_hours,
            "semi_major_axis":  r.semi_major_axis,
            "orbital_velocity": r.orbital_velocity,
        }

    def calculate_orbital_velocity(self, radius_km, semi_major_axis_km) -> dict:
        """
        Orbital velocity via the vis-viva equation.
        Both radius_km and semi_major_axis_km are from Earth's center (not altitude).
        """
        try:
            r = float(radius_km)
            a = float(semi_major_axis_km)
        except ValueError:
            return {"error": "All inputs must be valid numbers."}
        if r <= self.R_EARTH:
            return {"error": f"Radius must be greater than Earth's radius ({self.R_EARTH} km)."}
        if a <= self.R_EARTH:
            return {"error": f"Semi-major axis must be greater than Earth's radius ({self.R_EARTH} km)."}
        if r > 2 * a:
            return {"error": "Radius cannot exceed 2x the semi-major axis (not a bound orbit)."}

        res = self.lib.calculate_orbital_velocity(r, a)
        return {
            "velocity":          res.velocity,
            "semi_major_axis":   res.semi_major_axis,
            "radius":            res.radius,
            "escape_velocity":   res.escape_velocity,
            "circular_velocity": res.circular_velocity,
        }

    def calculate_bielliptic(self, alt_initial_km, alt_final_km,
                              alt_intermediate_km) -> dict:
        """Bi-elliptic transfer via an intermediate orbit."""
        try:
            o = float(alt_initial_km)
            d = float(alt_final_km)
            i = float(alt_intermediate_km)
        except ValueError:
            return {"error": "All altitudes must be valid numbers."}
        if o < 0 or d < 0 or i < 0:
            return {"error": "Altitudes cannot be negative."}
        if i <= max(o, d):
            return {"error": "Intermediate altitude must be greater than both origin and destination altitudes."}

        r = self.lib.calculate_bielliptic(o, d, i)
        return {
            "delta_v1":            r.delta_v1,
            "delta_v2":            r.delta_v2,
            "delta_v3":            r.delta_v3,
            "total_delta_v":       r.total_delta_v,
            "time_of_flight":      r.time_of_flight,
            "time_transfer1":      r.time_transfer1,
            "time_transfer2":      r.time_transfer2,
            "intermediate_radius": r.intermediate_radius,
            "hohmann_delta_v":     r.hohmann_delta_v,
            "efficiency_gain":     r.efficiency_gain,
        }

    def calculate_inclination_change(self, altitude_km,
                                      inclination_deg) -> dict:
        """Pure plane change maneuver at a given altitude."""
        try:
            alt = float(altitude_km)
            inc = float(inclination_deg)
        except ValueError:
            return {"error": "All inputs must be valid numbers."}
        if alt < 0:
            return {"error": "Altitude cannot be negative."}
        if inc <= 0 or inc > 180:
            return {"error": "Inclination change must be between 0 and 180 degrees."}

        r = self.lib.calculate_inclination_change(alt, inc)
        return {
            "delta_v":                r.delta_v,
            "inclination_change_deg": r.inclination_change_deg,
            "orbital_velocity":       r.orbital_velocity,
            "optimal_altitude":       r.optimal_altitude,
        }

    def calculate_combined_transfer(self, alt_initial_km, alt_final_km,
                                     inclination_deg) -> dict:
        """Hohmann transfer combined with inclination change at apoapsis."""
        try:
            o   = float(alt_initial_km)
            d   = float(alt_final_km)
            inc = float(inclination_deg)
        except ValueError:
            return {"error": "All inputs must be valid numbers."}
        if o < 0 or d < 0:
            return {"error": "Altitudes cannot be negative."}
        if inc <= 0 or inc > 180:
            return {"error": "Inclination change must be between 0 and 180 degrees."}

        r = self.lib.calculate_combined_transfer(o, d, inc)
        return {
            "delta_v1":                 r.delta_v1,
            "delta_v2":                 r.delta_v2,
            "total_delta_v":            r.total_delta_v,
            "time_of_flight":           r.time_of_flight,
            "inclination_change_deg":   r.inclination_change_deg,
            "plane_change_at_apoapsis": r.plane_change_at_apoapsis,
            "hohmann_only_delta_v":     r.hohmann_only_delta_v,
            "separate_delta_v":         r.separate_delta_v,
            "savings_vs_separate":      r.savings_vs_separate,
        }


# ---------------------------------------------------------------------------
# Isolated Test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        engine = OrbitalEngine()

        print("=== Hohmann Transfer ===")
        h = engine.calculate_transfer(400, 35786)
        print(f"  Total ΔV:    {h['total_delta_v']:.4f} km/s")
        print(f"  Flight time: {h['time_of_flight']:.4f} hours")

        print("\n=== Simple Tsiolkovsky (constant ve) ===")
        # Falcon 9 second stage: ve ≈ 3.48 km/s, dry mass ~4000 kg, wet ~111000 kg
        t_simple = engine.calculate_tsiolkovsky_simple(
            ve_km_s=3.48,
            mass_initial_kg=111000,
            mass_final_kg=4000
        )
        print(f"  ΔV achieved:      {t_simple['delta_v']:.4f} km/s")
        print(f"  Propellant used:  {t_simple['propellant_mass']:.1f} kg")
        print(f"  Mass ratio (m0/mf): {t_simple['mass_ratio']:.4f}")

        print("\n=== General Tsiolkovsky (variable ve, Simpson's rule) ===")
        # Same rocket, but ve varies from 3.48 to 3.20 km/s as tank empties
        t_general = engine.calculate_tsiolkovsky_general(
            ve_initial_km_s=3.48,
            ve_final_km_s=3.20,
            mass_initial_kg=111000,
            mass_final_kg=4000
        )
        print(f"  ΔV achieved:      {t_general['delta_v']:.4f} km/s")
        print(f"  Propellant used:  {t_general['propellant_mass']:.1f} kg")
        print(f"  Mass ratio (m0/mf): {t_general['mass_ratio']:.4f}")

        print("\n=== Comparison: Simple vs General ===")
        diff = t_simple['delta_v'] - t_general['delta_v']
        print(f"  ΔV difference: {diff:.4f} km/s")
        print(f"  (General gives less ΔV because ve degrades over the burn)")

        print("\n=== Orbital Period ===")
        # ISS at 400 km → ~92.6 min; GEO at 35786 km → ~23.93 h
        p_iss = engine.calculate_orbital_period(400)
        print(f"  ISS (400 km): {p_iss['period_seconds']/60:.1f} min ({p_iss['period_hours']:.2f} hours)")
        print(f"    Orbital velocity: {p_iss['orbital_velocity']:.4f} km/s")
        p_geo = engine.calculate_orbital_period(35786)
        print(f"  GEO (35786 km): {p_geo['period_hours']:.2f} hours")

        print("\n=== Orbital Velocity (Vis-Viva) ===")
        # Circular orbit at 400 km → ~7.67 km/s
        r_iss = 400 + 6371.0
        v_iss = engine.calculate_orbital_velocity(r_iss, r_iss)
        print(f"  Circular at 400 km: {v_iss['velocity']:.4f} km/s")
        print(f"    Escape velocity:  {v_iss['escape_velocity']:.4f} km/s")
        # Apogee of Hohmann transfer (200 → 35786 km)
        a_trans = (6571.0 + 42157.0) / 2.0
        v_apo = engine.calculate_orbital_velocity(42157.0, a_trans)
        print(f"  Apogee of 200→35786 transfer: {v_apo['velocity']:.4f} km/s")

        print("\n=== Bi-Elliptic Transfer ===")
        # LEO 200 km → 500,000 km via 1,000,000 km intermediate
        be = engine.calculate_bielliptic(200, 500000, 1000000)
        print(f"  LEO → 500,000 km (via 1M km):")
        print(f"    ΔV1: {be['delta_v1']:.4f}, ΔV2: {be['delta_v2']:.4f}, ΔV3: {be['delta_v3']:.4f}")
        print(f"    Total ΔV: {be['total_delta_v']:.4f} km/s")
        print(f"    Hohmann ΔV: {be['hohmann_delta_v']:.4f} km/s")
        print(f"    Efficiency gain: {be['efficiency_gain']:.2f}%")
        # LEO → GEO (should be worse than Hohmann)
        be2 = engine.calculate_bielliptic(200, 35786, 100000)
        print(f"  LEO → GEO (via 100,000 km):")
        print(f"    Total ΔV: {be2['total_delta_v']:.4f} km/s")
        print(f"    Hohmann ΔV: {be2['hohmann_delta_v']:.4f} km/s")
        print(f"    Efficiency gain: {be2['efficiency_gain']:.2f}%")

        print("\n=== Inclination Change ===")
        # 28.5 deg at GEO → ~1.83 km/s
        ic = engine.calculate_inclination_change(35786, 28.5)
        print(f"  28.5° at GEO: ΔV = {ic['delta_v']:.4f} km/s")
        print(f"    Orbital velocity: {ic['orbital_velocity']:.4f} km/s")

        print("\n=== Combined Transfer (Hohmann + Plane Change) ===")
        # LEO 200 km → GEO + 28.5° inclination change
        ct = engine.calculate_combined_transfer(200, 35786, 28.5)
        print(f"  LEO → GEO + 28.5° plane change:")
        print(f"    ΔV1: {ct['delta_v1']:.4f} km/s, ΔV2: {ct['delta_v2']:.4f} km/s")
        print(f"    Total: {ct['total_delta_v']:.4f} km/s")
        print(f"    Hohmann only: {ct['hohmann_only_delta_v']:.4f} km/s")
        print(f"    Separate maneuvers: {ct['separate_delta_v']:.4f} km/s")
        print(f"    Savings: {ct['savings_vs_separate']:.2f}%")

    except Exception as e:
        print(f"Test failed: {e}")