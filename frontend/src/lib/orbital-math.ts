// Earth constants
export const EARTH_RADIUS_KM = 6371;
export const MU_EARTH = 398600.4418; // km³/s²

export interface OrbitalGeometry {
  r1: number; // origin orbit radius (km)
  r2: number; // destination orbit radius (km)
  a_transfer: number; // semi-major axis of transfer ellipse (km)
  b_transfer: number; // semi-minor axis of transfer ellipse (km)
  e_transfer: number; // eccentricity of transfer ellipse
  v1_circular: number; // circular velocity at origin (km/s)
  v2_circular: number; // circular velocity at destination (km/s)
  v_perigee: number; // velocity at transfer perigee (km/s)
  v_apogee: number; // velocity at transfer apogee (km/s)
}

export interface HohmannVisualizationData {
  origin_km: number;
  destination_km: number;
  delta_v1: number;
  delta_v2: number;
  total_delta_v: number;
  time_of_flight: number;
  geometry: OrbitalGeometry;
}

export function computeOrbitalGeometry(
  origin_km: number,
  destination_km: number
): OrbitalGeometry {
  const r1 = origin_km + EARTH_RADIUS_KM;
  const r2 = destination_km + EARTH_RADIUS_KM;

  const a_transfer = (r1 + r2) / 2;
  const b_transfer = Math.sqrt(r1 * r2);
  const c = a_transfer - r1; // distance from focus (Earth) to ellipse center
  const e_transfer = c / a_transfer;

  const v1_circular = Math.sqrt(MU_EARTH / r1);
  const v2_circular = Math.sqrt(MU_EARTH / r2);
  const v_perigee = Math.sqrt(MU_EARTH * ((2 / r1) - (1 / a_transfer)));
  const v_apogee = Math.sqrt(MU_EARTH * ((2 / r2) - (1 / a_transfer)));

  return {
    r1,
    r2,
    a_transfer,
    b_transfer,
    e_transfer,
    v1_circular,
    v2_circular,
    v_perigee,
    v_apogee,
  };
}

export function buildVisualizationData(
  args: { origin_km: number; destination_km: number },
  result: {
    delta_v1: number;
    delta_v2: number;
    total_delta_v: number;
    time_of_flight: number;
  }
): HohmannVisualizationData {
  return {
    ...args,
    ...result,
    geometry: computeOrbitalGeometry(args.origin_km, args.destination_km),
  };
}

// ---------------------------------------------------------------------------
// Bi-Elliptic Geometry
// ---------------------------------------------------------------------------

export interface BiEllipticGeometry {
  r1: number;
  r2: number;
  rb: number;
  a1: number; // semi-major axis of first transfer
  b1: number; // semi-minor axis of first transfer
  a2: number; // semi-major axis of second transfer
  b2: number; // semi-minor axis of second transfer
}

export interface BiEllipticVisualizationData {
  origin_km: number;
  destination_km: number;
  intermediate_km: number;
  delta_v1: number;
  delta_v2: number;
  delta_v3: number;
  total_delta_v: number;
  time_of_flight: number;
  hohmann_delta_v: number;
  efficiency_gain: number;
  geometry: BiEllipticGeometry;
}

export function computeBiEllipticGeometry(
  origin_km: number,
  destination_km: number,
  intermediate_km: number
): BiEllipticGeometry {
  const r1 = origin_km + EARTH_RADIUS_KM;
  const r2 = destination_km + EARTH_RADIUS_KM;
  const rb = intermediate_km + EARTH_RADIUS_KM;

  const a1 = (r1 + rb) / 2;
  const b1 = Math.sqrt(r1 * rb);
  const a2 = (rb + r2) / 2;
  const b2 = Math.sqrt(rb * r2);

  return { r1, r2, rb, a1, b1, a2, b2 };
}

export function buildBiEllipticVisualizationData(
  args: { origin_km: number; destination_km: number; intermediate_km: number },
  result: {
    delta_v1: number;
    delta_v2: number;
    delta_v3: number;
    total_delta_v: number;
    time_of_flight: number;
    hohmann_delta_v: number;
    efficiency_gain: number;
  }
): BiEllipticVisualizationData {
  return {
    ...args,
    ...result,
    geometry: computeBiEllipticGeometry(
      args.origin_km,
      args.destination_km,
      args.intermediate_km
    ),
  };
}

// ---------------------------------------------------------------------------
// Inclination Visualization
// ---------------------------------------------------------------------------

export interface InclinationVisualizationData {
  altitude_km: number;
  inclination_change_deg: number;
  delta_v: number;
  orbital_velocity: number;
  radius: number;
}

export function buildInclinationVisualizationData(
  altitude_km: number,
  inclination_change_deg: number,
  delta_v: number,
  orbital_velocity: number
): InclinationVisualizationData {
  return {
    altitude_km,
    inclination_change_deg,
    delta_v,
    orbital_velocity,
    radius: altitude_km + EARTH_RADIUS_KM,
  };
}

// ---------------------------------------------------------------------------
// Combined Transfer Visualization
// ---------------------------------------------------------------------------

export interface CombinedVisualizationData {
  origin_km: number;
  destination_km: number;
  inclination_change_deg: number;
  delta_v1: number;
  delta_v2: number;
  total_delta_v: number;
  time_of_flight: number;
  geometry: OrbitalGeometry;
}

export function buildCombinedVisualizationData(
  args: {
    origin_km: number;
    destination_km: number;
    inclination_change_deg: number;
  },
  result: {
    delta_v1: number;
    delta_v2: number;
    total_delta_v: number;
    time_of_flight: number;
  }
): CombinedVisualizationData {
  return {
    ...args,
    ...result,
    geometry: computeOrbitalGeometry(args.origin_km, args.destination_km),
  };
}

/**
 * Maps orbital radii (km) to SVG coordinate units.
 * Ensures the smaller orbit is at least 12% of the viewbox
 * when the ratio exceeds 10:1.
 */
export function scaleRadius(
  radiusKm: number,
  maxRadiusKm: number,
  viewBoxHalf: number
): number {
  const padding = 0.85; // leave 15% margin
  const minFraction = 0.12;
  const ratio = maxRadiusKm / Math.max(radiusKm, 1);

  if (ratio > 10) {
    // Use sqrt scaling for extreme ratios
    const sqrtMax = Math.sqrt(maxRadiusKm);
    const sqrtR = Math.sqrt(radiusKm);
    return (sqrtR / sqrtMax) * viewBoxHalf * padding;
  }

  const scaled = (radiusKm / maxRadiusKm) * viewBoxHalf * padding;
  const minSize = viewBoxHalf * minFraction;
  return Math.max(scaled, minSize);
}

/**
 * Returns true if the radius ratio is extreme enough
 * that we need to note "not to scale".
 */
export function isNotToScale(r1: number, r2: number): boolean {
  const ratio = Math.max(r1, r2) / Math.min(r1, r2);
  return ratio > 10;
}
