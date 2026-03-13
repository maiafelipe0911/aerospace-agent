import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { HohmannVisualizationData } from "@/lib/orbital-math";
import { EARTH_RADIUS_KM } from "@/lib/orbital-math";

// Scale factor: map km to Three.js world units
const SCALE = 1 / 1000;

function generateCirclePoints(radius: number, segments = 128): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
  }
  return points;
}

function generateTransferArcPoints(
  r1: number,
  _r2: number,
  a: number,
  b: number,
  segments = 128
): [number, number, number][] {
  const c = a - r1; // focus offset
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = Math.PI + (i / segments) * Math.PI; // PI to 2PI (bottom half)
    const x = a * Math.cos(t) + c;
    const z = b * Math.sin(t);
    points.push([x * SCALE, 0, z * SCALE]);
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

function Satellite({
  arcPoints,
}: {
  arcPoints: [number, number, number][];
}) {
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

function Scene({ data }: { data: HohmannVisualizationData }) {
  const { geometry } = data;
  const { r1, r2, a_transfer, b_transfer } = geometry;

  const orbit1Points = useMemo(() => generateCirclePoints(r1 * SCALE), [r1]);
  const orbit2Points = useMemo(() => generateCirclePoints(r2 * SCALE), [r2]);
  const transferPoints = useMemo(
    () => generateTransferArcPoints(r1, r2, a_transfer, b_transfer),
    [r1, r2, a_transfer, b_transfer]
  );

  // Camera distance based on the outer orbit
  const camDist = r2 * SCALE * 2.5;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[camDist, camDist, camDist]} intensity={1.2} />

      <ErrorBoundaryEarth />

      {/* Origin orbit */}
      <Line
        points={orbit1Points}
        color="oklch(0.75 0.15 195)"
        lineWidth={1.5}
        dashed
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* Destination orbit */}
      <Line
        points={orbit2Points}
        color="oklch(0.72 0.16 160)"
        lineWidth={1.5}
        dashed
        dashSize={0.5}
        gapSize={0.3}
      />

      {/* Transfer arc */}
      <Line
        points={transferPoints}
        color="oklch(0.72 0.16 85)"
        lineWidth={2}
      />

      {/* Burn point markers */}
      <mesh position={[r1 * SCALE, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-r2 * SCALE, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>

      {/* Animated satellite */}
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

function ErrorBoundaryEarth() {
  try {
    return <Earth />;
  } catch {
    return <EarthFallback />;
  }
}

interface OrbitViewer3DProps {
  data: HohmannVisualizationData;
}

export default function OrbitViewer3D({ data }: OrbitViewer3DProps) {
  const camDist = data.geometry.r2 * SCALE * 2.5;

  return (
    <Canvas
      camera={{ position: [0, camDist * 0.7, camDist], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Scene data={data} />
    </Canvas>
  );
}
