import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { BiEllipticVisualizationData } from "@/lib/orbital-math";
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

function generateTransferArcPoints(
  rStart: number,
  a: number,
  b: number,
  startAngle: number,
  endAngle: number,
  segments = 128
): [number, number, number][] {
  const c = a - rStart;
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = startAngle + (i / segments) * (endAngle - startAngle);
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
    progressRef.current = (progressRef.current + delta * 0.1) % 1;
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

function Scene({ data }: { data: BiEllipticVisualizationData }) {
  const { geometry } = data;
  const { r1, r2, rb, a1, b1, a2, b2 } = geometry;

  const orbit1Points = useMemo(() => generateCirclePoints(r1 * SCALE), [r1]);
  const orbit2Points = useMemo(() => generateCirclePoints(r2 * SCALE), [r2]);
  const orbitBPoints = useMemo(() => generateCirclePoints(rb * SCALE), [rb]);

  // First transfer arc: from r1 (perigee) to rb (apogee) — bottom half
  const transfer1Points = useMemo(
    () => generateTransferArcPoints(r1, a1, b1, Math.PI, 2 * Math.PI),
    [r1, a1, b1]
  );

  // Second transfer arc: from rb back down to r2 — top half
  // For the second ellipse, Earth is at the far focus (apogee side)
  const transfer2Points = useMemo(() => {
    const c2 = a2 - r2;
    const points: [number, number, number][] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI; // 0 to PI (top half)
      const x = a2 * Math.cos(t) - c2;
      const z = b2 * Math.sin(t);
      points.push([x * SCALE, 0, z * SCALE]);
    }
    return points;
  }, [a2, b2, r2]);

  // Combined path for satellite animation
  const allPoints = useMemo(
    () => [...transfer1Points, ...transfer2Points],
    [transfer1Points, transfer2Points]
  );

  const camDist = rb * SCALE * 2.5;

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[camDist, camDist, camDist]} intensity={1.2} />

      <ErrorBoundaryEarth />

      {/* Origin orbit */}
      <Line points={orbit1Points} color="oklch(0.75 0.15 195)" lineWidth={1.5} dashed dashSize={0.5} gapSize={0.3} />

      {/* Destination orbit */}
      <Line points={orbit2Points} color="oklch(0.72 0.16 160)" lineWidth={1.5} dashed dashSize={0.5} gapSize={0.3} />

      {/* Intermediate orbit */}
      <Line points={orbitBPoints} color="oklch(0.65 0.12 280)" lineWidth={1} dashed dashSize={0.4} gapSize={0.4} />

      {/* First transfer arc */}
      <Line points={transfer1Points} color="oklch(0.72 0.16 85)" lineWidth={2} />

      {/* Second transfer arc */}
      <Line points={transfer2Points} color="oklch(0.70 0.16 55)" lineWidth={2} />

      {/* Burn point markers */}
      <mesh position={[r1 * SCALE, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-rb * SCALE, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[r2 * SCALE, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>

      <Satellite arcPoints={allPoints} />

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

interface OrbitViewer3DBiEllipticProps {
  data: BiEllipticVisualizationData;
}

export default function OrbitViewer3DBiElliptic({ data }: OrbitViewer3DBiEllipticProps) {
  const camDist = data.geometry.rb * SCALE * 2.5;

  return (
    <Canvas
      camera={{ position: [0, camDist * 0.7, camDist], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <Scene data={data} />
    </Canvas>
  );
}
