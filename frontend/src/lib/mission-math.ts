/** Standard gravitational acceleration (m/s²) */
const G0 = 9.80665;

/** Convert specific impulse (seconds) to exhaust velocity (km/s) */
export function ispToExhaustVelocity(isp_s: number): number {
  return (isp_s * G0) / 1000;
}

/** Convert exhaust velocity (km/s) to specific impulse (seconds) */
export function exhaustVelocityToIsp(ve_km_s: number): number {
  return (ve_km_s * 1000) / G0;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  requiredDeltaV: number;
  availableDeltaV: number;
  deltaVMargin: number;
  requiredPropellantKg: number;
  additionalPropellantKg: number;
}

/**
 * Determine whether a mission is feasible given spacecraft parameters.
 *
 * @param totalDeltaV       Required delta-v from the Hohmann transfer (km/s)
 * @param exhaustVelocityKmS Engine exhaust velocity (km/s)
 * @param dryMassKg         Spacecraft dry mass (kg)
 * @param propellantCapacityKg Maximum propellant the spacecraft can carry (kg)
 */
export function computeFeasibility(
  totalDeltaV: number,
  exhaustVelocityKmS: number,
  dryMassKg: number,
  propellantCapacityKg: number,
): FeasibilityResult {
  const wetMass = dryMassKg + propellantCapacityKg;
  const availableDeltaV =
    exhaustVelocityKmS * Math.log(wetMass / dryMassKg);

  const requiredMassRatio = Math.exp(totalDeltaV / exhaustVelocityKmS);
  const requiredWetMass = dryMassKg * requiredMassRatio;
  const requiredPropellantKg = requiredWetMass - dryMassKg;

  const isFeasible = availableDeltaV >= totalDeltaV;
  const additionalPropellantKg = isFeasible
    ? 0
    : requiredPropellantKg - propellantCapacityKg;

  return {
    isFeasible,
    requiredDeltaV: totalDeltaV,
    availableDeltaV,
    deltaVMargin: availableDeltaV - totalDeltaV,
    requiredPropellantKg,
    additionalPropellantKg,
  };
}
