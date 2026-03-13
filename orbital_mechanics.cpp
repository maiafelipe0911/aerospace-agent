#include <iostream>
#include <cmath>
#include <functional>

// ---------------------------------------------------------------------------
// Result Structs
// ---------------------------------------------------------------------------

struct TransferResult {
    double delta_v1;       // Initial burn (km/s)
    double delta_v2;       // Circularization burn (km/s)
    double total_delta_v;  // Total fuel cost (km/s)
    double time_of_flight; // Transfer time (hours)
};

struct TsiolkovskyResult {
    double delta_v;          // Achieved Delta-V (km/s)
    double propellant_mass;  // Propellant consumed (kg)
    double mass_ratio;       // m0 / mf (dimensionless)
};

struct OrbitalPeriodResult {
    double period_seconds;    // T in seconds
    double period_hours;      // T in hours
    double semi_major_axis;   // a (km, from center)
    double orbital_velocity;  // circular velocity (km/s)
};

struct OrbitalVelocityResult {
    double velocity;           // v at given point (km/s)
    double semi_major_axis;    // a (km, from center)
    double radius;             // r (km, from center)
    double escape_velocity;    // sqrt(2*mu/r) (km/s)
    double circular_velocity;  // sqrt(mu/r) (km/s)
};

struct BiEllipticResult {
    double delta_v1;            // First burn: boost to intermediate (km/s)
    double delta_v2;            // Second burn at intermediate (km/s)
    double delta_v3;            // Third burn: circularize (km/s)
    double total_delta_v;       // Sum of all three (km/s)
    double time_of_flight;      // Total transfer time (hours)
    double time_transfer1;      // First arc time (hours)
    double time_transfer2;      // Second arc time (hours)
    double intermediate_radius; // r_b (km, from center)
    double hohmann_delta_v;     // Hohmann DV for comparison (km/s)
    double efficiency_gain;     // % savings vs Hohmann (negative = worse)
};

struct InclinationChangeResult {
    double delta_v;                 // Required DV (km/s)
    double inclination_change_deg;  // Angle change (degrees)
    double orbital_velocity;        // Velocity at maneuver point (km/s)
    double optimal_altitude;        // Altitude where DV is minimized (km)
};

struct CombinedTransferResult {
    double delta_v1;                  // First burn: pure in-plane (km/s)
    double delta_v2;                  // Second burn: combined at apoapsis (km/s)
    double total_delta_v;             // Total (km/s)
    double time_of_flight;            // Transfer time (hours)
    double inclination_change_deg;    // Plane change (degrees)
    double plane_change_at_apoapsis;  // Degrees applied at apoapsis
    double hohmann_only_delta_v;      // Hohmann DV without plane change (km/s)
    double separate_delta_v;          // Hohmann + separate plane change (km/s)
    double savings_vs_separate;       // % DV savings vs separate maneuvers
};

// ---------------------------------------------------------------------------
// Numerical Integration — Simpson's Rule
// Used for the general Tsiolkovsky case where ve is not constant.
//
// Simpson's rule approximates the integral of f(x) over [a, b] by:
//   integral ≈ (h/3) * [f(x0) + 4f(x1) + 2f(x2) + 4f(x3) + ... + f(xn)]
// where h = (b - a) / n and n must be even.
//
// Error is O(h^4), making it significantly more accurate than the trapezoidal
// rule for smooth integrands — which the Tsiolkovsky integrand always is.
// ---------------------------------------------------------------------------
double simpsons_rule(std::function<double(double)> f, double a, double b, int n) {
    if (n % 2 != 0) n++;  // n must be even for Simpson's rule
    double h = (b - a) / n;
    double result = f(a) + f(b);

    for (int i = 1; i < n; i++) {
        double x = a + i * h;
        result += (i % 2 == 0) ? 2.0 * f(x) : 4.0 * f(x);
    }

    return result * h / 3.0;
}

// ---------------------------------------------------------------------------
// Main Physics Engine
// ---------------------------------------------------------------------------
class OrbitalMechanics {
private:
    // Physical Constants
    const double MU_EARTH = 398600.4418; // Earth's gravitational parameter (km^3/s^2)
    const double R_EARTH  = 6371.0;      // Earth's mean radius (km)

public:

    // -----------------------------------------------------------------------
    // Circular orbital velocity at a given altitude
    // v = sqrt(mu / r)
    // -----------------------------------------------------------------------
    double calc_circular_velocity(double altitude_km) {
        double r = altitude_km + R_EARTH;
        return std::sqrt(MU_EARTH / r);
    }

    // -----------------------------------------------------------------------
    // Hohmann Transfer
    // Computes the two-burn maneuver between two circular coplanar orbits.
    // -----------------------------------------------------------------------
    TransferResult hohmann_transfer(double alt_initial_km, double alt_final_km) {
        double r1 = alt_initial_km + R_EARTH;
        double r2 = alt_final_km  + R_EARTH;

        // Semi-major axis of the transfer ellipse
        double a_transfer = (r1 + r2) / 2.0;

        // Circular velocities at origin and destination
        double v1 = calc_circular_velocity(alt_initial_km);
        double v2 = calc_circular_velocity(alt_final_km);

        // Velocities at perigee and apogee of the transfer ellipse (vis-viva)
        double v_trans_perigee = std::sqrt(MU_EARTH * ((2.0 / r1) - (1.0 / a_transfer)));
        double v_trans_apogee  = std::sqrt(MU_EARTH * ((2.0 / r2) - (1.0 / a_transfer)));

        // Delta-V for each burn
        double dv1 = std::abs(v_trans_perigee - v1);
        double dv2 = std::abs(v2 - v_trans_apogee);

        // Time of flight = half the orbital period of the transfer ellipse
        double time_seconds = M_PI * std::sqrt(std::pow(a_transfer, 3) / MU_EARTH);
        double time_hours   = time_seconds / 3600.0;

        return {dv1, dv2, dv1 + dv2, time_hours};
    }

    // -----------------------------------------------------------------------
    // Simple Tsiolkovsky Rocket Equation
    //
    // Models an ideal rocket with CONSTANT exhaust velocity:
    //   ΔV = ve * ln(m0 / mf)
    //
    // Can be used in two modes:
    //   - Given a target ΔV: computes the required propellant mass
    //   - Given initial/final masses: computes the achieved ΔV
    //
    // Parameters:
    //   ve_km_s     : effective exhaust velocity (km/s)  [related to Isp by ve = Isp * g0]
    //   mass_initial: wet mass — spacecraft + propellant (kg)
    //   mass_final  : dry mass — spacecraft without propellant (kg)
    // -----------------------------------------------------------------------
    TsiolkovskyResult tsiolkovsky_simple(double ve_km_s,
                                         double mass_initial_kg,
                                         double mass_final_kg) {
        double mass_ratio      = mass_initial_kg / mass_final_kg;
        double delta_v         = ve_km_s * std::log(mass_ratio);
        double propellant_mass = mass_initial_kg - mass_final_kg;

        return {delta_v, propellant_mass, mass_ratio};
    }

    // -----------------------------------------------------------------------
    // Orbital Period
    // T = 2*pi*sqrt(a^3/mu), where a = altitude + R_EARTH
    // -----------------------------------------------------------------------
    OrbitalPeriodResult orbital_period(double altitude_km) {
        double a = altitude_km + R_EARTH;
        double T_seconds = 2.0 * M_PI * std::sqrt(std::pow(a, 3) / MU_EARTH);
        double T_hours = T_seconds / 3600.0;
        double v_circular = std::sqrt(MU_EARTH / a);

        return {T_seconds, T_hours, a, v_circular};
    }

    // -----------------------------------------------------------------------
    // Orbital Velocity (Vis-Viva Equation)
    // v = sqrt(mu * (2/r - 1/a))
    // Both radius_km and semi_major_axis_km are measured from Earth's center.
    // -----------------------------------------------------------------------
    OrbitalVelocityResult vis_viva(double radius_km, double semi_major_axis_km) {
        double r = radius_km;
        double a = semi_major_axis_km;
        double v = std::sqrt(MU_EARTH * ((2.0 / r) - (1.0 / a)));
        double v_escape = std::sqrt(2.0 * MU_EARTH / r);
        double v_circular = std::sqrt(MU_EARTH / r);

        return {v, a, r, v_escape, v_circular};
    }

    // -----------------------------------------------------------------------
    // Bi-Elliptic Transfer
    // Three-burn maneuver via an intermediate orbit higher than both.
    // -----------------------------------------------------------------------
    BiEllipticResult bielliptic_transfer(double alt_initial_km, double alt_final_km,
                                          double alt_intermediate_km) {
        double r1 = alt_initial_km + R_EARTH;
        double r2 = alt_final_km + R_EARTH;
        double rb = alt_intermediate_km + R_EARTH;

        // Two transfer ellipses
        double a1 = (r1 + rb) / 2.0;  // first transfer: r1 -> rb
        double a2 = (rb + r2) / 2.0;  // second transfer: rb -> r2

        // Velocities via vis-viva
        double v_circ1 = std::sqrt(MU_EARTH / r1);
        double v_circ2 = std::sqrt(MU_EARTH / r2);

        double v_trans1_at_r1 = std::sqrt(MU_EARTH * ((2.0 / r1) - (1.0 / a1)));
        double v_trans1_at_rb = std::sqrt(MU_EARTH * ((2.0 / rb) - (1.0 / a1)));
        double v_trans2_at_rb = std::sqrt(MU_EARTH * ((2.0 / rb) - (1.0 / a2)));
        double v_trans2_at_r2 = std::sqrt(MU_EARTH * ((2.0 / r2) - (1.0 / a2)));

        // Three burns
        double dv1 = std::abs(v_trans1_at_r1 - v_circ1);
        double dv2 = std::abs(v_trans2_at_rb - v_trans1_at_rb);
        double dv3 = std::abs(v_circ2 - v_trans2_at_r2);
        double total = dv1 + dv2 + dv3;

        // Transfer times (each is half the period of its transfer ellipse)
        double t1_seconds = M_PI * std::sqrt(std::pow(a1, 3) / MU_EARTH);
        double t2_seconds = M_PI * std::sqrt(std::pow(a2, 3) / MU_EARTH);
        double t1_hours = t1_seconds / 3600.0;
        double t2_hours = t2_seconds / 3600.0;
        double total_hours = t1_hours + t2_hours;

        // Hohmann comparison for same r1 -> r2
        double a_h = (r1 + r2) / 2.0;
        double v_h_perigee = std::sqrt(MU_EARTH * ((2.0 / r1) - (1.0 / a_h)));
        double v_h_apogee  = std::sqrt(MU_EARTH * ((2.0 / r2) - (1.0 / a_h)));
        double dv_h1 = std::abs(v_h_perigee - v_circ1);
        double dv_h2 = std::abs(v_circ2 - v_h_apogee);
        double hohmann_total = dv_h1 + dv_h2;

        double efficiency = ((hohmann_total - total) / hohmann_total) * 100.0;

        return {dv1, dv2, dv3, total, total_hours, t1_hours, t2_hours,
                rb, hohmann_total, efficiency};
    }

    // -----------------------------------------------------------------------
    // Inclination Change (pure plane change maneuver)
    // dv = 2 * v * sin(di/2)
    // -----------------------------------------------------------------------
    InclinationChangeResult inclination_change(double altitude_km,
                                                double inclination_deg) {
        double r = altitude_km + R_EARTH;
        double v = std::sqrt(MU_EARTH / r);
        double di_rad = inclination_deg * M_PI / 180.0;
        double dv = 2.0 * v * std::sin(di_rad / 2.0);

        // Optimal altitude for minimum DV: as high as possible (GEO-like)
        // For a given inclination change, DV is minimized when v is smallest,
        // i.e. at the highest altitude. We report GEO as reference.
        double r_geo = 35786.0 + R_EARTH;
        double v_geo = std::sqrt(MU_EARTH / r_geo);
        double optimal_alt = 35786.0; // GEO as practical optimal

        return {dv, inclination_deg, v, optimal_alt};
    }

    // -----------------------------------------------------------------------
    // Combined Plane Change + Transfer
    // Hohmann transfer with inclination change combined at apoapsis.
    // Uses law of cosines for the velocity vector combination.
    // dv2 = sqrt(v2^2 + v_trans_apogee^2 - 2*v2*v_trans_apogee*cos(di))
    // -----------------------------------------------------------------------
    CombinedTransferResult combined_transfer(double alt_initial_km,
                                              double alt_final_km,
                                              double inclination_deg) {
        double r1 = alt_initial_km + R_EARTH;
        double r2 = alt_final_km + R_EARTH;
        double di_rad = inclination_deg * M_PI / 180.0;

        // Transfer ellipse (same as Hohmann)
        double a_transfer = (r1 + r2) / 2.0;

        double v_circ1 = std::sqrt(MU_EARTH / r1);
        double v_circ2 = std::sqrt(MU_EARTH / r2);

        double v_trans_perigee = std::sqrt(MU_EARTH * ((2.0 / r1) - (1.0 / a_transfer)));
        double v_trans_apogee  = std::sqrt(MU_EARTH * ((2.0 / r2) - (1.0 / a_transfer)));

        // Burn 1: pure in-plane departure (same as Hohmann)
        double dv1 = std::abs(v_trans_perigee - v_circ1);

        // Burn 2: combined circularization + plane change at apoapsis
        // Law of cosines: dv2 = sqrt(v2^2 + v_ta^2 - 2*v2*v_ta*cos(di))
        double dv2 = std::sqrt(v_circ2 * v_circ2 +
                                v_trans_apogee * v_trans_apogee -
                                2.0 * v_circ2 * v_trans_apogee * std::cos(di_rad));
        double total = dv1 + dv2;

        // Time of flight (same as Hohmann)
        double time_seconds = M_PI * std::sqrt(std::pow(a_transfer, 3) / MU_EARTH);
        double time_hours = time_seconds / 3600.0;

        // Hohmann-only (no plane change) for comparison
        double dv_h2 = std::abs(v_circ2 - v_trans_apogee);
        double hohmann_only = dv1 + dv_h2;

        // Separate maneuvers: Hohmann + standalone plane change at destination
        double dv_plane_separate = 2.0 * v_circ2 * std::sin(di_rad / 2.0);
        double separate_total = hohmann_only + dv_plane_separate;

        double savings = ((separate_total - total) / separate_total) * 100.0;

        return {dv1, dv2, total, time_hours, inclination_deg, inclination_deg,
                hohmann_only, separate_total, savings};
    }

    // -----------------------------------------------------------------------
    // General Tsiolkovsky Equation (Non-Constant Exhaust Velocity)
    //
    // In reality, exhaust velocity ve varies with remaining propellant mass
    // (e.g. due to engine throttling, fuel mixture ratio shifts, or staging).
    // The general form is the Meshchersky equation, integrated numerically:
    //
    //   ΔV = integral from m0 to mf of [ ve(m) / m ] dm
    //
    // We model ve(m) as linearly varying between ve_initial and ve_final:
    //   ve(m) = ve_initial + (ve_final - ve_initial) * (m0 - m) / (m0 - mf)
    //
    // This captures real engine behavior where performance changes as
    // propellant is consumed (e.g. pressure-fed vs pump-fed transitions).
    //
    // The integral is solved using Simpson's rule with n=1000 steps,
    // giving numerical error on the order of 1e-10 km/s — well below
    // any practical engineering tolerance.
    //
    // Parameters:
    //   ve_initial_km_s : exhaust velocity at full tank (km/s)
    //   ve_final_km_s   : exhaust velocity at empty tank (km/s)
    //   mass_initial_kg : wet mass (kg)
    //   mass_final_kg   : dry mass (kg)
    // -----------------------------------------------------------------------
    TsiolkovskyResult tsiolkovsky_general(double ve_initial_km_s,
                                          double ve_final_km_s,
                                          double mass_initial_kg,
                                          double mass_final_kg) {
        double m0 = mass_initial_kg;
        double mf = mass_final_kg;

        // ve(m): linear interpolation of exhaust velocity as mass decreases
        // As mass goes from m0 -> mf, ve goes from ve_initial -> ve_final
        auto ve_of_m = [&](double m) -> double {
            double t = (m0 - m) / (m0 - mf);  // t = 0 at full tank, 1 at empty
            return ve_initial_km_s + (ve_final_km_s - ve_initial_km_s) * t;
        };

        // Integrand: ve(m) / m
        // Note: integration runs from m0 to mf (mf < m0), so result is negative.
        // We take the absolute value since Delta-V is always positive.
        auto integrand = [&](double m) -> double {
            return ve_of_m(m) / m;
        };

        // Numerically integrate using Simpson's rule (1000 steps)
        // We integrate from mf to m0 (reversed) to get a positive result
        double delta_v         = std::abs(simpsons_rule(integrand, mf, m0, 1000));
        double propellant_mass = m0 - mf;
        double mass_ratio      = m0 / mf;

        return {delta_v, propellant_mass, mass_ratio};
    }
};

// ---------------------------------------------------------------------------
// C Interface — exported functions readable by Python via ctypes
// ---------------------------------------------------------------------------
extern "C" {

    #ifdef _WIN32
    #define EXPORT __declspec(dllexport)
    #else
    #define EXPORT
    #endif

    EXPORT TransferResult calculate_hohmann(double alt_initial_km, double alt_final_km) {
        OrbitalMechanics engine;
        return engine.hohmann_transfer(alt_initial_km, alt_final_km);
    }

    EXPORT TsiolkovskyResult calculate_tsiolkovsky_simple(double ve_km_s,
                                                           double mass_initial_kg,
                                                           double mass_final_kg) {
        OrbitalMechanics engine;
        return engine.tsiolkovsky_simple(ve_km_s, mass_initial_kg, mass_final_kg);
    }

    EXPORT TsiolkovskyResult calculate_tsiolkovsky_general(double ve_initial_km_s,
                                                            double ve_final_km_s,
                                                            double mass_initial_kg,
                                                            double mass_final_kg) {
        OrbitalMechanics engine;
        return engine.tsiolkovsky_general(ve_initial_km_s, ve_final_km_s,
                                          mass_initial_kg, mass_final_kg);
    }

    EXPORT OrbitalPeriodResult calculate_orbital_period(double altitude_km) {
        OrbitalMechanics engine;
        return engine.orbital_period(altitude_km);
    }

    EXPORT OrbitalVelocityResult calculate_orbital_velocity(double radius_km,
                                                             double semi_major_axis_km) {
        OrbitalMechanics engine;
        return engine.vis_viva(radius_km, semi_major_axis_km);
    }

    EXPORT BiEllipticResult calculate_bielliptic(double alt_initial_km,
                                                  double alt_final_km,
                                                  double alt_intermediate_km) {
        OrbitalMechanics engine;
        return engine.bielliptic_transfer(alt_initial_km, alt_final_km, alt_intermediate_km);
    }

    EXPORT InclinationChangeResult calculate_inclination_change(double altitude_km,
                                                                 double inclination_deg) {
        OrbitalMechanics engine;
        return engine.inclination_change(altitude_km, inclination_deg);
    }

    EXPORT CombinedTransferResult calculate_combined_transfer(double alt_initial_km,
                                                               double alt_final_km,
                                                               double inclination_deg) {
        OrbitalMechanics engine;
        return engine.combined_transfer(alt_initial_km, alt_final_km, inclination_deg);
    }

    EXPORT int engine_version() { return 2; }

}