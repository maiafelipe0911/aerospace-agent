from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.core.engine import get_engine
from backend.core.tools import dispatch_tool

router = APIRouter()

# ---------------------------------------------------------------------------
# Request models — one per tool
# ---------------------------------------------------------------------------

class HohmannRequest(BaseModel):
    origin_km: float
    destination_km: float


class TsiolkovskySimpleRequest(BaseModel):
    ve_km_s: float
    mass_initial_kg: float
    mass_final_kg: float


class TsiolkovskyGeneralRequest(BaseModel):
    ve_initial_km_s: float
    ve_final_km_s: float
    mass_initial_kg: float
    mass_final_kg: float


class OrbitalPeriodRequest(BaseModel):
    altitude_km: float


class OrbitalVelocityRequest(BaseModel):
    radius_km: float
    semi_major_axis_km: float


class BiEllipticRequest(BaseModel):
    origin_km: float
    destination_km: float
    intermediate_km: float


class InclinationChangeRequest(BaseModel):
    altitude_km: float
    inclination_change_deg: float


class CombinedTransferRequest(BaseModel):
    origin_km: float
    destination_km: float
    inclination_change_deg: float


# Map URL slug → (full tool name, request model)
_TOOL_MAP = {
    "hohmann":               ("calculate_hohmann",              HohmannRequest),
    "tsiolkovsky_simple":    ("calculate_tsiolkovsky_simple",   TsiolkovskySimpleRequest),
    "tsiolkovsky_general":   ("calculate_tsiolkovsky_general",  TsiolkovskyGeneralRequest),
    "orbital_period":        ("calculate_orbital_period",       OrbitalPeriodRequest),
    "orbital_velocity":      ("calculate_orbital_velocity",     OrbitalVelocityRequest),
    "bielliptic":            ("calculate_bielliptic",           BiEllipticRequest),
    "inclination_change":    ("calculate_inclination_change",   InclinationChangeRequest),
    "combined_transfer":     ("calculate_combined_transfer",    CombinedTransferRequest),
}

# ---------------------------------------------------------------------------
# Route — accepts any of the three tool slugs
# ---------------------------------------------------------------------------

@router.post("/{tool_name}")
async def calculate(tool_name: str, body: dict):
    if tool_name not in _TOOL_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown tool '{tool_name}'. Valid options: {list(_TOOL_MAP)}",
        )

    fn_name, model_cls = _TOOL_MAP[tool_name]

    # Validate body against the tool's Pydantic model
    try:
        validated = model_cls(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    engine = get_engine()
    result = dispatch_tool(fn_name, validated.model_dump(), engine)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result
