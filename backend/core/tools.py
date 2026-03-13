"""
Tool definitions and dispatcher — provider-agnostic source of truth.

TOOL_DEFINITIONS: plain dicts describing each tool. Adapters in backend/llm/
translate these into provider-specific formats.

dispatch_tool(): routes an AI tool call to the correct OrbitalEngine method.
"""

# ---------------------------------------------------------------------------
# Provider-agnostic tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "name": "calculate_hohmann",
        "description": (
            "Calculates the Delta-V for each burn and the total flight time for a "
            "Hohmann transfer between two circular coplanar orbits around Earth. "
            "Use this when the user asks about orbital transfers, how much fuel is needed "
            "to move a satellite between two altitudes, or how long a transfer takes."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "origin_km": {
                    "type": "number",
                    "description": "Altitude of the initial circular orbit above Earth's surface, in km (e.g. 400 for LEO).",
                },
                "destination_km": {
                    "type": "number",
                    "description": "Altitude of the target circular orbit above Earth's surface, in km (e.g. 35786 for GEO).",
                },
            },
            "required": ["origin_km", "destination_km"],
        },
    },
    {
        "name": "calculate_tsiolkovsky_simple",
        "description": (
            "Solves the simple Tsiolkovsky rocket equation: ΔV = ve * ln(m0 / mf), "
            "assuming a CONSTANT exhaust velocity throughout the burn. "
            "Use this when the user asks how much propellant is needed for a given Delta-V, "
            "or what Delta-V a rocket can achieve given its mass and engine performance. "
            "Use this version when exhaust velocity is constant or unknown."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "ve_km_s": {
                    "type": "number",
                    "description": (
                        "Effective exhaust velocity in km/s. "
                        "Related to specific impulse by: ve = Isp * 9.80665 / 1000. "
                        "Typical values: chemical rockets 2.5-4.5 km/s, ion engines 15-80 km/s."
                    ),
                },
                "mass_initial_kg": {
                    "type": "number",
                    "description": "Initial (wet) mass of the rocket including propellant, in kg.",
                },
                "mass_final_kg": {
                    "type": "number",
                    "description": "Final (dry) mass of the rocket after propellant is consumed, in kg.",
                },
            },
            "required": ["ve_km_s", "mass_initial_kg", "mass_final_kg"],
        },
    },
    {
        "name": "calculate_tsiolkovsky_general",
        "description": (
            "Solves the general Tsiolkovsky equation for a VARIABLE exhaust velocity, "
            "modeled as linearly varying from ve_initial (full tank) to ve_final (empty tank). "
            "Integrates ΔV = ∫ve(m)/m dm numerically using Simpson's rule. "
            "Use this when the engine performance changes during the burn — for example, "
            "due to throttling, pressure changes, or fuel mixture ratio shifts. "
            "Always prefer this over the simple version when exhaust velocity is not constant."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "ve_initial_km_s": {
                    "type": "number",
                    "description": "Exhaust velocity at the start of the burn (full tank), in km/s.",
                },
                "ve_final_km_s": {
                    "type": "number",
                    "description": "Exhaust velocity at the end of the burn (empty tank), in km/s.",
                },
                "mass_initial_kg": {
                    "type": "number",
                    "description": "Initial (wet) mass of the rocket including propellant, in kg.",
                },
                "mass_final_kg": {
                    "type": "number",
                    "description": "Final (dry) mass of the rocket after propellant is consumed, in kg.",
                },
            },
            "required": ["ve_initial_km_s", "ve_final_km_s", "mass_initial_kg", "mass_final_kg"],
        },
    },
    {
        "name": "calculate_orbital_period",
        "description": (
            "Calculates the orbital period, semi-major axis, and circular velocity for a "
            "circular orbit at a given altitude above Earth's surface. "
            "Use this when the user asks how long an orbit takes, what the period is at a "
            "given altitude, or about orbital timing and scheduling."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "altitude_km": {
                    "type": "number",
                    "description": "Altitude of the circular orbit above Earth's surface, in km (e.g. 400 for ISS, 35786 for GEO).",
                },
            },
            "required": ["altitude_km"],
        },
    },
    {
        "name": "calculate_orbital_velocity",
        "description": (
            "Calculates the orbital velocity at any point in an orbit using the vis-viva equation: "
            "v = sqrt(mu * (2/r - 1/a)). Also returns escape velocity and circular velocity at that radius. "
            "Use this when the user asks how fast a satellite is moving at a specific point in its orbit, "
            "or about orbital speed, escape velocity, or velocity comparisons. "
            "IMPORTANT: Both radius_km and semi_major_axis_km are measured from Earth's CENTER "
            "(not altitude above surface). Add Earth's radius (6371 km) to altitude to get radius. "
            "For a circular orbit, radius equals semi_major_axis."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "radius_km": {
                    "type": "number",
                    "description": (
                        "Distance from Earth's CENTER to the point where velocity is calculated, in km. "
                        "For altitude above surface, add 6371 km (Earth's radius). "
                        "Example: ISS at 400 km altitude → radius = 6771 km."
                    ),
                },
                "semi_major_axis_km": {
                    "type": "number",
                    "description": (
                        "Semi-major axis of the orbit from Earth's CENTER, in km. "
                        "For a circular orbit at altitude h: a = h + 6371. "
                        "For an elliptical orbit: a = (r_perigee + r_apogee) / 2."
                    ),
                },
            },
            "required": ["radius_km", "semi_major_axis_km"],
        },
    },
    {
        "name": "calculate_bielliptic",
        "description": (
            "Calculates a bi-elliptic transfer between two circular orbits via a higher intermediate orbit. "
            "Uses three burns instead of two. Includes a built-in Hohmann comparison with efficiency gain percentage. "
            "Use this when the user asks about bi-elliptic transfers, or when comparing transfer strategies "
            "for large orbit ratio changes (destination/origin radius > ~12, where bi-elliptic can beat Hohmann). "
            "The intermediate altitude must be higher than both origin and destination."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "origin_km": {
                    "type": "number",
                    "description": "Altitude of the initial circular orbit above Earth's surface, in km.",
                },
                "destination_km": {
                    "type": "number",
                    "description": "Altitude of the target circular orbit above Earth's surface, in km.",
                },
                "intermediate_km": {
                    "type": "number",
                    "description": (
                        "Altitude of the intermediate orbit above Earth's surface, in km. "
                        "Must be higher than both origin and destination. "
                        "Higher values give more fuel savings for large orbit ratios but longer transfer times."
                    ),
                },
            },
            "required": ["origin_km", "destination_km", "intermediate_km"],
        },
    },
    {
        "name": "calculate_inclination_change",
        "description": (
            "Calculates the Delta-V required for a pure orbital plane change (inclination change) "
            "at a given altitude using: dv = 2 * v * sin(di/2). "
            "Use this when the user asks about changing orbital inclination without changing altitude. "
            "Plane changes are cheaper at higher altitudes where orbital velocity is lower."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "altitude_km": {
                    "type": "number",
                    "description": "Altitude of the circular orbit where the plane change is performed, in km.",
                },
                "inclination_change_deg": {
                    "type": "number",
                    "description": "Desired inclination change in degrees (0-180).",
                },
            },
            "required": ["altitude_km", "inclination_change_deg"],
        },
    },
    {
        "name": "calculate_combined_transfer",
        "description": (
            "Calculates a Hohmann transfer combined with an inclination change at apoapsis. "
            "This is more efficient than performing a Hohmann transfer and a separate plane change. "
            "Uses the law of cosines for the combined burn at apoapsis. "
            "Includes comparison with Hohmann-only and separate-maneuver totals. "
            "Use this when the user needs to change both altitude and inclination "
            "(e.g. LEO at 28.5 deg to GEO at 0 deg)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "origin_km": {
                    "type": "number",
                    "description": "Altitude of the initial circular orbit above Earth's surface, in km.",
                },
                "destination_km": {
                    "type": "number",
                    "description": "Altitude of the target circular orbit above Earth's surface, in km.",
                },
                "inclination_change_deg": {
                    "type": "number",
                    "description": "Desired inclination change in degrees (0-180).",
                },
            },
            "required": ["origin_km", "destination_km", "inclination_change_deg"],
        },
    },
]

# ---------------------------------------------------------------------------
# Human-readable status messages emitted before tool dispatch
# ---------------------------------------------------------------------------

TOOL_STATUS_MESSAGES = {
    "calculate_hohmann":             "Calculating Hohmann transfer orbit...",
    "calculate_tsiolkovsky_simple":  "Computing propellant requirements (constant ve)...",
    "calculate_tsiolkovsky_general": "Computing propellant requirements (variable ve)...",
    "calculate_orbital_period":      "Computing orbital period...",
    "calculate_orbital_velocity":    "Computing orbital velocity (vis-viva)...",
    "calculate_bielliptic":          "Calculating bi-elliptic transfer orbit...",
    "calculate_inclination_change":  "Computing inclination change maneuver...",
    "calculate_combined_transfer":   "Calculating combined transfer with plane change...",
}

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ARIA (Aerospace Reasoning & Intelligence Agent), an expert aerospace engineering assistant.
Always respond in English.

## Personality & Tone
You are technical and precise, but also approachable and educational. You explain complex aerospace
concepts in a way that is rigorous enough for engineers, yet clear enough for enthusiastic learners.
Think of yourself as a knowledgeable colleague who genuinely enjoys discussing aerospace engineering.
Never be condescending — meet the user at their level.

## Areas of Expertise
Your knowledge covers three core domains:
- Orbital Mechanics & Transfers: Hohmann transfers, bi-elliptic transfers, orbital velocities,
  Delta-V budgets, orbital periods, inclination changes, combined plane-change maneuvers,
  phasing maneuvers, and general two-body problem concepts.
- Rocket Propulsion & Delta-V: Tsiolkovsky rocket equation, specific impulse (Isp),
  propellant mass estimation, staging strategies, and engine performance analysis.
- Satellite Systems & Subsystems: Attitude control (ADCS), power systems, communication
  links, thermal management, structural considerations, and mission design trade-offs.

## Tool Usage — Orbital Engine
You have access to eight high-precision tools backed by a C++ physics engine:

### Transfer Tools
1. calculate_hohmann
   - Two-burn transfer between circular coplanar orbits
   - Outputs: Delta-V1, Delta-V2, Total Delta-V, Flight Time

2. calculate_bielliptic
   - Three-burn transfer via a higher intermediate orbit
   - Includes built-in Hohmann comparison with efficiency percentage
   - More efficient than Hohmann when orbit ratio > ~12
   - Outputs: Delta-V1/2/3, Total, Transfer times, Hohmann comparison

3. calculate_combined_transfer
   - Hohmann transfer + inclination change combined at apoapsis
   - More efficient than performing them separately
   - Outputs: Delta-V1/2, Total, Time, Hohmann-only comparison, separate-maneuver comparison, savings %

### Propulsion Tools
4. calculate_tsiolkovsky_simple
   - Constant exhaust velocity: ΔV = ve * ln(m0 / mf)
   - Outputs: Delta-V, propellant mass, mass ratio

5. calculate_tsiolkovsky_general
   - Variable exhaust velocity via numerical integration
   - Prefer this when ve is not constant

### Orbital Info Tools
6. calculate_orbital_period
   - Period, velocity, and semi-major axis for a circular orbit at given altitude
   - Outputs: period (seconds & hours), semi-major axis, circular velocity

7. calculate_orbital_velocity
   - Vis-viva equation: v = sqrt(mu * (2/r - 1/a))
   - IMPORTANT: radius_km and semi_major_axis_km are from Earth's CENTER (add 6371 km to altitude)
   - For circular orbits, radius = semi_major_axis
   - Outputs: velocity, escape velocity, circular velocity

8. calculate_inclination_change
   - Pure plane change: dv = 2 * v * sin(di/2)
   - Outputs: Delta-V, orbital velocity, optimal altitude for minimum DV

## Tool Selection Decision Tree
- Period/timing question → calculate_orbital_period
- Speed at a point in orbit → calculate_orbital_velocity (remember: params are from Earth's center, not altitude)
- Transfer between same-inclination orbits → calculate_hohmann
- Large orbit ratio transfer (r2/r1 > ~12) → suggest calculate_bielliptic + compare with Hohmann
- Plane change only (no altitude change) → calculate_inclination_change
- Altitude + inclination change → calculate_combined_transfer
- Fuel/propellant with constant engine → calculate_tsiolkovsky_simple
- Fuel/propellant with varying engine → calculate_tsiolkovsky_general

## Tool Chaining Patterns
- Mission ΔV budget: calculate_hohmann → calculate_tsiolkovsky_simple (propellant for Hohmann)
- Transfer comparison: calculate_hohmann + calculate_bielliptic for same altitudes
- Bi-elliptic propellant: calculate_bielliptic → calculate_tsiolkovsky_simple
- Combined mission propellant: calculate_combined_transfer → calculate_tsiolkovsky_simple
- When a Hohmann transfer result shows a large orbit ratio (destination radius / origin radius > ~12),
  proactively suggest comparing with a bi-elliptic transfer, as it may be more fuel-efficient.
  Call calculate_bielliptic with an intermediate altitude significantly higher than the destination.

Always proactively suggest and trigger calculations whenever the user provides enough data.

When returning results from the engine, always:
1. Present the raw values clearly with proper units
2. Explain the physical meaning of each value
3. Relate the result to real-world context when possible (e.g. compare to known missions or rockets)

## Boundaries
- Stay focused on your three domains. If asked about unrelated topics, politely redirect.
- If a question is outside your tool scope (e.g. interplanetary transfers, three-body problems),
  explain the limitation clearly and provide a theoretical answer based on your knowledge.
- CRITICAL: Never simulate, fake, or describe tool calls in your response text.
  When a calculation is needed, trigger the actual tool — do not write code blocks or
  invent JSON outputs. If you cannot call a tool, say so explicitly instead of guessing.
- Never fabricate numerical results — always use the orbital engine for calculations.

## Response Format
- Use clear structure when presenting calculations or multi-step explanations
- Keep conversational answers concise but complete
- Use standard aerospace units: km, km/s, hours, seconds, kg, and m/s2 where appropriate"""


# ---------------------------------------------------------------------------
# Tool dispatcher — routes AI tool calls to OrbitalEngine methods
# ---------------------------------------------------------------------------

def dispatch_tool(fn_name: str, args: dict, engine) -> dict:
    """Routes a tool call from the AI to the correct engine method."""
    if engine is None:
        return {"error": "Physics engine is not available."}

    if fn_name == "calculate_hohmann":
        return engine.calculate_transfer(
            alt_origem_km=args["origin_km"],
            alt_destino_km=args["destination_km"],
        )

    elif fn_name == "calculate_tsiolkovsky_simple":
        return engine.calculate_tsiolkovsky_simple(
            ve_km_s=args["ve_km_s"],
            mass_initial_kg=args["mass_initial_kg"],
            mass_final_kg=args["mass_final_kg"],
        )

    elif fn_name == "calculate_tsiolkovsky_general":
        return engine.calculate_tsiolkovsky_general(
            ve_initial_km_s=args["ve_initial_km_s"],
            ve_final_km_s=args["ve_final_km_s"],
            mass_initial_kg=args["mass_initial_kg"],
            mass_final_kg=args["mass_final_kg"],
        )

    elif fn_name == "calculate_orbital_period":
        return engine.calculate_orbital_period(
            altitude_km=args["altitude_km"],
        )

    elif fn_name == "calculate_orbital_velocity":
        return engine.calculate_orbital_velocity(
            radius_km=args["radius_km"],
            semi_major_axis_km=args["semi_major_axis_km"],
        )

    elif fn_name == "calculate_bielliptic":
        return engine.calculate_bielliptic(
            alt_initial_km=args["origin_km"],
            alt_final_km=args["destination_km"],
            alt_intermediate_km=args["intermediate_km"],
        )

    elif fn_name == "calculate_inclination_change":
        return engine.calculate_inclination_change(
            altitude_km=args["altitude_km"],
            inclination_deg=args["inclination_change_deg"],
        )

    elif fn_name == "calculate_combined_transfer":
        return engine.calculate_combined_transfer(
            alt_initial_km=args["origin_km"],
            alt_final_km=args["destination_km"],
            inclination_deg=args["inclination_change_deg"],
        )

    else:
        return {"error": f"Tool '{fn_name}' not found in the engine."}
