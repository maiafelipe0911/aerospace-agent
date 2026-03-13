import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { CombinedVisualizationData } from "@/lib/orbital-math";
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
    const y = z * Math.sin(inclinationRad);
    const zr = z * Math.cos(inclinationRad);
    points.push([x, y, zr]);
  }
  return points;
}

function generateTransferArc(
  r1: number,
  _r2: number,
  a: number,
  b: number,
  inclinationRad: number,
  segments = 128
): [number, number, number][] {
  const c = a - r1;
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const frac = i / segments;
    const t = Math.PI + frac * Math.PI; // PI to 2PI (bottom half)
    const x = a * Math.cos(t) + c;
    const z = b * Math.sin(t);
    // Gradually tilt from flat to inclined
    const tiltFrac = frac; // linear interpolation of tilt
    const y = z * Math.sin(inclinationRad * tiltFrac);
    const zr = z * Math.cos(inclinationRad * tiltFrac);
    points.push([x * SCALE, y * SCALE, zr * SCALE]);
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

function Satellite({ arcPoints }: { arcPoints: [number, number, number][] }) {
  const ref = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current || arcPoints.length === 0) return;
    progressRef.current = (progressRef.current + delta * 0.15) % 1;
    const idx = Math.floor(progressRef.current * (arcPoints.length - 1));
    const pt = arcPoints[idx];
    ref.current.position.set(pt[0], pt[1], pt[2]);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
    </mesh>
  );
}

function Scene({ data }: { data: CombinedVisualizationData }) {
  const { geometry } = data;
  const { r1, r2, a_transfer, b_transfer } = geometry;
  const incRad = (data.inclination_change_deg * Math.PI) / 180;

  const orbit1Points = useMemo(() => generateCirclePoints(r1 * SCALE), [r1]);
  const orbit2Points = useMemo(
    () => generateTiltedCirclePoints(r2 * SCALE, incRad),
    [r2, incRad]
  );

  const transferPoints = useMemo(
    () => generateTransferArc(r1, r2, a_transfer, b_transfer, incRad),
    [r1, r2, a_transfer, b_transfer, incRad]
  );

  const camDist = r2 * SCALE * 2.5;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[camDist, camDist, camDist]} intensity={1.2} />

      <ErrorBoundaryEarth />

      {/* Origin orbit (flat) */}
      <Line
        points={orbit1Points}
        color="oklch(0.75 0.15 195)"
        lineWidth={1.5}
        dashed dashSize={0.5} gapSize={0.3}
      />

      {/* Destination orbit (tilted) */}
      <Line
        points={orbit2Points}
        color="oklch(0.72 0.16 340)"
        lineWidth={1.5}
        dashed dashSize={0.5} gapSize={0.3}
      />

      {/* Transfer arc (transitions between planes) */}
      <Line
        points={transferPoints}
        color="oklch(0.72 0.16 85)"
        lineWidth={2}
      />

      {/* Burn point 1 — departure */}
      <mesh position={[r1 * SCALE, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>

      {/* Burn point 2 — arrival (combined burn at apoapsis in tilted plane) */}
      {transferPoints.length > 0 && (
        <mesh position={transferPoints[transferPoints.length - 1]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.6} />
        </mesh>
      )}

      <Satellite arcPoints={transferPoints} />

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

interface OrbitViewer3DCombinedProps {
  data: CombinedVisualizationData;
}

export default function OrbitViewer3DCombined({ data }: OrbitViewer3DCombinedProps) {
  const camDist = data.geometry.r2 * SCALE * 2.5;

  return (
    <Canvas
      camera={{ position: [camDist * 0.5, camDist * 0.8, camDist * 0.5], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Scene data={data} />
    </Canvas>
  );
}
