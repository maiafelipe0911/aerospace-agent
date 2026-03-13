import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Line, useTexture } from "@react-three/drei";
import type { InclinationVisualizationData } from "@/lib/orbital-math";
import { EARTH_RADIUS_KM } from "@/lib/orbital-math";

const SCALE = 1 / 1000;

function generateCirclePoints(radius: number, segments = 128): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
  }
  return points;
}

function generateTiltedCirclePoints(
  radius: number,
  inclinationRad: number,
  segments = 128
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    // Rotate around X axis by inclination
    const y = z * Math.sin(inclinationRad);
    const zr = z * Math.cos(inclinationRad);
    points.push([x, y, zr]);
  }
  return points;
}

function Earth() {
  const texture = useTexture("/textures/earth.jpg");
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS_KM * SCALE, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS_KM * SCALE, 64, 64]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  );
}

function ErrorBoundaryEarth() {
  try {
    return <Earth />;
  } catch {
    return <EarthFallback />;
  }
}

function Scene({ data }: { data: InclinationVisualizationData }) {
  const r = data.radius;
  const incRad = (data.inclination_change_deg * Math.PI) / 180;

  const originalPoints = useMemo(
    () => generateCirclePoints(r * SCALE),
    [r]
  );

  const newPoints = useMemo(
    () => generateTiltedCirclePoints(r * SCALE, incRad),
    [r, incRad]
  );

  const camDist = r * SCALE * 3;

  // Burn point at line of nodes (x-axis intersection)
  const burnPos: [number, number, number] = [r * SCALE, 0, 0];

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[camDist, camDist, camDist]} intensity={1.2} />

      <ErrorBoundaryEarth />

      {/* Original orbit (flat) */}
      <Line
        points={originalPoints}
        color="oklch(0.75 0.15 195)"
        lineWidth={1.5}
        dashed dashSize={0.5} gapSize={0.3}
      />

      {/* New orbit (tilted) */}
      <Line
        points={newPoints}
        color="oklch(0.72 0.16 340)"
        lineWidth={2}
      />

      {/* Burn point */}
      <mesh position={burnPos}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>

      {/* Vector arrow at burn point showing plane change direction */}
      <Line
        points={[
          burnPos,
          [burnPos[0], burnPos[1] + r * SCALE * 0.15 * Math.sin(incRad), burnPos[2]],
        ]}
        color="#f43f5e"
        lineWidth={3}
      />

      <Stars radius={camDist * 3} depth={50} count={3000} factor={2} fade />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={EARTH_RADIUS_KM * SCALE * 1.5}
        maxDistance={camDist * 3}
      />
    </>
  );
}

interface OrbitViewer3DInclinationProps {
  data: InclinationVisualizationData;
}

export default function OrbitViewer3DInclination({ data }: OrbitViewer3DInclinationProps) {
  const camDist = data.radius * SCALE * 3;

  return (
    <Canvas
      camera={{ position: [camDist * 0.5, camDist * 0.8, camDist * 0.5], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Scene data={data} />
    </Canvas>
  );
}
