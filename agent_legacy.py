import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from point import OrbitalEngine

# 1. Load environment variables and configure the API
load_dotenv("key.env")
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 2. Initialize the Physical Engine (loads the DLL once)
engine = OrbitalEngine()

# ---------------------------------------------------------------------------
# 3. Tool Definitions
# ---------------------------------------------------------------------------

tool_hohmann = types.FunctionDeclaration(
    name="calculate_hohmann",
    description=(
        "Calculates the Delta-V for each burn and the total flight time for a "
        "Hohmann transfer between two circular coplanar orbits around Earth. "
        "Use this when the user asks about orbital transfers, how much fuel is needed "
        "to move a satellite between two altitudes, or how long a transfer takes."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "origin_km": types.Schema(
                type=types.Type.NUMBER,
                description="Altitude of the initial circular orbit above Earth's surface, in km (e.g. 400 for LEO).",
            ),
            "destination_km": types.Schema(
                type=types.Type.NUMBER,
                description="Altitude of the target circular orbit above Earth's surface, in km (e.g. 35786 for GEO).",
            ),
        },
        required=["origin_km", "destination_km"],
    ),
)

tool_tsiolkovsky_simple = types.FunctionDeclaration(
    name="calculate_tsiolkovsky_simple",
    description=(
        "Solves the simple Tsiolkovsky rocket equation: ΔV = ve * ln(m0 / mf), "
        "assuming a CONSTANT exhaust velocity throughout the burn. "
        "Use this when the user asks how much propellant is needed for a given Delta-V, "
        "or what Delta-V a rocket can achieve given its mass and engine performance. "
        "Use this version when exhaust velocity is constant or unknown."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "ve_km_s": types.Schema(
                type=types.Type.NUMBER,
                description=(
                    "Effective exhaust velocity in km/s. "
                    "Related to specific impulse by: ve = Isp * 9.80665 / 1000. "
                    "Typical values: chemical rockets 2.5-4.5 km/s, ion engines 15-80 km/s."
                ),
            ),
            "mass_initial_kg": types.Schema(
                type=types.Type.NUMBER,
                description="Initial (wet) mass of the rocket including propellant, in kg.",
            ),
            "mass_final_kg": types.Schema(
                type=types.Type.NUMBER,
                description="Final (dry) mass of the rocket after propellant is consumed, in kg.",
            ),
        },
        required=["ve_km_s", "mass_initial_kg", "mass_final_kg"],
    ),
)

tool_tsiolkovsky_general = types.FunctionDeclaration(
    name="calculate_tsiolkovsky_general",
    description=(
        "Solves the general Tsiolkovsky equation for a VARIABLE exhaust velocity, "
        "modeled as linearly varying from ve_initial (full tank) to ve_final (empty tank). "
        "Integrates ΔV = ∫ve(m)/m dm numerically using Simpson's rule. "
        "Use this when the engine performance changes during the burn — for example, "
        "due to throttling, pressure changes, or fuel mixture ratio shifts. "
        "Always prefer this over the simple version when exhaust velocity is not constant."
    ),
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "ve_initial_km_s": types.Schema(
                type=types.Type.NUMBER,
                description="Exhaust velocity at the start of the burn (full tank), in km/s.",
            ),
            "ve_final_km_s": types.Schema(
                type=types.Type.NUMBER,
                description="Exhaust velocity at the end of the burn (empty tank), in km/s.",
            ),
            "mass_initial_kg": types.Schema(
                type=types.Type.NUMBER,
                description="Initial (wet) mass of the rocket including propellant, in kg.",
            ),
            "mass_final_kg": types.Schema(
                type=types.Type.NUMBER,
                description="Final (dry) mass of the rocket after propellant is consumed, in kg.",
            ),
        },
        required=["ve_initial_km_s", "ve_final_km_s", "mass_initial_kg", "mass_final_kg"],
    ),
)

# ---------------------------------------------------------------------------
# 4. Function dispatcher — maps tool name -> real Python function
# ---------------------------------------------------------------------------

def dispatch_tool(fn_name: str, args: dict) -> dict:
    """Routes a tool call from the AI to the correct engine method."""

    if fn_name == "calculate_hohmann":
        return engine.calculate_transfer(
            alt_origem_km=args["origin_km"],
            alt_destino_km=args["destination_km"]
        )

    elif fn_name == "calculate_tsiolkovsky_simple":
        return engine.calculate_tsiolkovsky_simple(
            ve_km_s=args["ve_km_s"],
            mass_initial_kg=args["mass_initial_kg"],
            mass_final_kg=args["mass_final_kg"]
        )

    elif fn_name == "calculate_tsiolkovsky_general":
        return engine.calculate_tsiolkovsky_general(
            ve_initial_km_s=args["ve_initial_km_s"],
            ve_final_km_s=args["ve_final_km_s"],
            mass_initial_kg=args["mass_initial_kg"],
            mass_final_kg=args["mass_final_kg"]
        )

    else:
        return {"error": f"Tool '{fn_name}' not found in the engine."}

# ---------------------------------------------------------------------------
# 5. Config — tools + system prompt
# ---------------------------------------------------------------------------

# Wrap FunctionDeclarations inside a Tool object (required by the API)
orbital_tools = types.Tool(
    function_declarations=[tool_hohmann, tool_tsiolkovsky_simple, tool_tsiolkovsky_general]
)

config = types.GenerateContentConfig(
    tools=[orbital_tools],
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    tool_config=types.ToolConfig(
        function_calling_config=types.FunctionCallingConfig(mode="AUTO")
    ),
    system_instruction="""You are ARIA (Aerospace Reasoning & Intelligence Agent), an expert aerospace engineering assistant.
    Always respond in English.

    ## Personality & Tone
    You are technical and precise, but also approachable and educational. You explain complex aerospace
    concepts in a way that is rigorous enough for engineers, yet clear enough for enthusiastic learners.
    Think of yourself as a knowledgeable colleague who genuinely enjoys discussing aerospace engineering.
    Never be condescending — meet the user at their level.

    ## Areas of Expertise
    Your knowledge covers three core domains:
    - Orbital Mechanics & Transfers: Hohmann transfers, orbital velocities, Delta-V budgets,
      orbital periods, inclination changes, phasing maneuvers, and general two-body problem concepts.
    - Rocket Propulsion & Delta-V: Tsiolkovsky rocket equation, specific impulse (Isp),
      propellant mass estimation, staging strategies, and engine performance analysis.
    - Satellite Systems & Subsystems: Attitude control (ADCS), power systems, communication
      links, thermal management, structural considerations, and mission design trade-offs.

    ## Tool Usage — Orbital Engine
    You have access to three high-precision tools backed by a C++ physics engine:

    1. calculate_hohmann
       - Use for orbital transfers between two circular orbits
       - Outputs: Delta-V1, Delta-V2, Total Delta-V, Flight Time

    2. calculate_tsiolkovsky_simple
       - Use when exhaust velocity is constant throughout the burn
       - Solves: ΔV = ve * ln(m0 / mf)
       - Outputs: Delta-V achieved, propellant consumed, mass ratio

    3. calculate_tsiolkovsky_general
       - Use when exhaust velocity VARIES during the burn (more realistic)
       - Solves the integral ΔV = ∫ve(m)/m dm numerically via Simpson's rule
       - Outputs: Delta-V achieved, propellant consumed, mass ratio
       - Always prefer this over the simple version when ve is not constant

    Tool selection reasoning:
    - If the user asks about moving between orbits → calculate_hohmann
    - If the user asks about fuel/propellant with constant engine performance → calculate_tsiolkovsky_simple
    - If the user asks about fuel/propellant with varying engine performance → calculate_tsiolkovsky_general
    - For complete mission analysis, chain tools: first hohmann (to get required ΔV), then tsiolkovsky (to get propellant mass)

    Always proactively suggest and trigger calculations whenever the user provides enough data.

    When returning results from the engine, always:
    1. Present the raw values clearly with proper units
    2. Explain the physical meaning of each value
    3. Relate the result to real-world context when possible (e.g. compare to known missions or rockets)

    ## Boundaries
    - Stay focused on your three domains. If asked about unrelated topics, politely redirect.
    - If a question is outside your tool scope (e.g. non-circular orbits, interplanetary transfers),
      explain the limitation clearly and provide a theoretical answer based on your knowledge.
    - CRITICAL: Never simulate, fake, or describe tool calls in your response text.
      When a calculation is needed, trigger the actual tool — do not write code blocks or
      invent JSON outputs. If you cannot call a tool, say so explicitly instead of guessing.
    - Never fabricate numerical results — always use the orbital engine for calculations.

    ## Response Format
    - Use clear structure when presenting calculations or multi-step explanations
    - Keep conversational answers concise but complete
    - Use standard aerospace units: km, km/s, hours, seconds, kg, and m/s2 where appropriate"""
)

# ---------------------------------------------------------------------------
# 6. Tool processor
# ---------------------------------------------------------------------------

def process_tool_call(function_call) -> types.Part:
    """Executes the tool requested by the AI and returns the result."""
    fn_name = function_call.name
    args    = dict(function_call.args)

    print(f"\n🔧 ARIA triggered tool: '{fn_name}'")
    print(f"   Args: {args}")

    print("⚙️  Firing orbital engine (C++)...")
    result = dispatch_tool(fn_name, args)
    print(f"✅ Result: {result}")

    return types.Part.from_function_response(
        name=fn_name,
        response=result
    )

# ---------------------------------------------------------------------------
# 7. Main agent loop
# ---------------------------------------------------------------------------

def run_agent():
    print("=" * 55)
    print("  🛸 ARIA — Aerospace Reasoning & Intelligence Agent")
    print("=" * 55)
    print("  Agent ready. Type 'exit' to quit.")
    print("=" * 55)

    history = []

    while True:
        print()
        user_input = input("You: ").strip()

        if not user_input:
            continue
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("\n🚀 Shutting down ARIA. See you on the next mission!")
            break

        print("\n🤔 ARIA: Analyzing request...")

        history.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_input)]
        ))

        # --- TURN 1: Send message, AI may request a tool ---
        response  = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=history,
            config=config
        )
        candidate = response.candidates[0]

        # gemini-2.5-flash may return None content during its thinking step
        if candidate.content is None:
            print("ARIA: I'm sorry, I couldn't generate a response. Please try again.")
            history.pop()
            continue

        # --- AGENTIC LOOP ---
        # ARIA may chain multiple tools (e.g. hohmann -> tsiolkovsky) before responding.
        # We loop until the model returns a text reply with no more tool calls.
        current_candidate = candidate
        max_tool_rounds = 5  # safety limit
        tool_round = 0

        while tool_round < max_tool_rounds:
            tool_calls = [
                part for part in current_candidate.content.parts
                if part.function_call is not None
            ]

            if not tool_calls:
                # No more tool calls — ARIA is ready to give the final answer
                break

            # Append ARIA's tool request(s) to history
            history.append(current_candidate.content)

            # Execute every tool call in this round
            tool_results = []
            for part in tool_calls:
                result_part = process_tool_call(part.function_call)
                tool_results.append(result_part)

            # Return results to ARIA
            history.append(types.Content(
                role="user",
                parts=tool_results
            ))

            tool_round += 1
            print(f"\n💬 ARIA: Continuing analysis (round {tool_round})...\n")

            # Ask ARIA to continue — she may call another tool or give the final answer
            next_response     = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=history,
                config=config
            )
            current_candidate = next_response.candidates[0]

            # Guard against None content during thinking step
            if current_candidate.content is None:
                print("ARIA: I'm sorry, I couldn't complete the analysis. Please try again.")
                history.pop()
                break

        # Extract and display the final text response
        final_parts = [p.text for p in current_candidate.content.parts if p.text]
        aria_reply  = "\n".join(final_parts) if final_parts else None

        if aria_reply:
            print(f"ARIA: {aria_reply}")
            history.append(types.Content(
                role="model",
                parts=[types.Part.from_text(text=aria_reply)]
            ))
        else:
            print("ARIA: I'm sorry, I couldn't generate a response. Please try again.")
            history.pop()

if __name__ == "__main__":
    run_agent()