/**
 * Experience3D: Main 3D canvas orchestrator -- 5-Scene Architecture
 * The Pattern Break: From analysis paralysis to LLC in 119 days.
 *
 * Timeline (normalized 0-1):
 *   0.00-0.03  Title
 *   0.03-0.18  I.  The Gravity Well (trapped in analysis)
 *   0.18-0.20  Transition I->II
 *   0.20-0.35  II. The Shatter (Oct 24, the break)
 *   0.35-0.37  Transition II->III
 *   0.37-0.52  III. The Lattice (building the arsenal)
 *   0.52-0.54  Transition III->IV
 *   0.54-0.69  IV. The Forge (real clients, real work)
 *   0.69-0.71  Transition IV->V
 *   0.71-0.86  V.  The Constellation (the full picture)
 *   0.86-1.00  Outro
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GravityWellParticles, DarkCore, AccretionRing, GravityWellLighting } from "./GravityWellScene";
import { ShardCloud, CrystalCore, ShockwaveRing, ShatterLighting } from "./ShatterScene";
import { LatticeNodes, LatticeEdges, LatticePulses, LatticeLighting } from "./LatticeScene";
import { ForgeStreams, ForgeCrystals, ForgeEmbers, ForgeGlow, ForgeLighting } from "./ForgeScene";
import { ConstellationStars, ConstellationLines, ConstellationNebula, CentralGlow, ConstellationLighting } from "./ConstellationScene";

interface SceneProps {
  progress: number;
  isMobile?: boolean;
}

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
    return gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext;
  } catch { return false; }
}

function GradientFallback({ progress }: { progress: number }) {
  const phase = progress * 5;
  return (
    <div className="fixed inset-0" style={{ zIndex: 0, background: "#0a0a0e" }}>
      <div style={{ position: "absolute", left: "20%", top: "25%", width: "30%", height: "50%", background: "radial-gradient(ellipse, rgba(180,140,60,0.12) 0%, transparent 70%)", opacity: Math.max(0, 1 - phase), filter: "blur(40px)" }} />
      <div style={{ position: "absolute", right: "15%", top: "20%", width: "35%", height: "45%", background: "radial-gradient(ellipse, rgba(20,184,166,0.1) 0%, transparent 70%)", opacity: Math.min(1, phase * 0.3), filter: "blur(50px)" }} />
    </div>
  );
}

/* === MORPH CAMERA === */

function MorphCamera({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 0.5, 12));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const zPull = isMobile ? 5.0 : 0;
  const xScale = isMobile ? 0.35 : 1;

  useFrame(() => {
    let pos: THREE.Vector3;
    let lookAt: THREE.Vector3;

    if (progress < 0.03) {
      pos = new THREE.Vector3(0, 0.5, 12 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.10) {
      const t = (progress - 0.03) / 0.07;
      const e = t * t * (3 - 2 * t);
      pos = new THREE.Vector3(Math.sin(e * 0.5) * 2 * xScale, 0.5 + e * 1.5, 12 - e * 5 + zPull);
      lookAt = new THREE.Vector3(0, -e * 0.5, 0);
    } else if (progress < 0.18) {
      const t = (progress - 0.10) / 0.08;
      const angle = t * Math.PI * 0.6;
      pos = new THREE.Vector3(Math.sin(angle) * 5 * xScale, 2 - t * 0.5, Math.cos(angle) * 5 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.20) {
      const t = (progress - 0.18) / 0.02;
      const e = t * t * (3 - 2 * t);
      pos = new THREE.Vector3(Math.sin(Math.PI * 0.3) * 5 * (1 - e) * xScale, 1.5 + e * 0.5, 5 * (1 - e) + 8 * e + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.35) {
      const t = (progress - 0.20) / 0.15;
      pos = new THREE.Vector3(Math.sin(t * Math.PI * 0.3) * 3 * xScale, 0.5 + t * 0.8, 6 + t * 2 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.37) {
      const t = (progress - 0.35) / 0.02;
      const e = t * t * (3 - 2 * t);
      pos = new THREE.Vector3(e * 2 * xScale, 1.3 + e, 8 - e * 2 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.52) {
      const t = (progress - 0.37) / 0.15;
      const angle = t * Math.PI * 0.5;
      pos = new THREE.Vector3(Math.sin(angle) * 6 * xScale, 1 + Math.sin(t * Math.PI) * 1.5, Math.cos(angle) * 6 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.54) {
      const t = (progress - 0.52) / 0.02;
      const e = t * t * (3 - 2 * t);
      pos = new THREE.Vector3(3 * (1 - e) * xScale, 2.5 - e * 1.5, 6 * (1 - e) + 7 * e + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.69) {
      const t = (progress - 0.54) / 0.15;
      pos = new THREE.Vector3(Math.sin(t * Math.PI * 0.4) * 4 * xScale, 3 - t * 1.5, 7 - t * 1 + zPull);
      lookAt = new THREE.Vector3(0, -0.5, 0);
    } else if (progress < 0.71) {
      const t = (progress - 0.69) / 0.02;
      const e = t * t * (3 - 2 * t);
      pos = new THREE.Vector3(0, 1.5 + e * 2, 6 + e * 3 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else if (progress < 0.86) {
      const t = (progress - 0.71) / 0.15;
      const angle = t * Math.PI * 0.4;
      pos = new THREE.Vector3(Math.sin(angle) * 8 * xScale, 2 + Math.sin(t * Math.PI * 0.5) * 1.5, Math.cos(angle) * 8 + zPull);
      lookAt = new THREE.Vector3(0, 0, 0);
    } else {
      const t = (progress - 0.86) / 0.14;
      pos = new THREE.Vector3(Math.sin(t * 0.5) * xScale, 2 + t * 8, 8 + t * 4 + zPull);
      lookAt = new THREE.Vector3(0, -1, 0);
    }

    const lerpSpeed = progress < 0.03 ? 0.015 : 0.035;
    currentPos.current.lerp(pos, lerpSpeed);
    currentLookAt.current.lerp(lookAt, lerpSpeed);
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

/* === SCENE GROUPS === */

function GravityWellGroup({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const fade = progress < 0.20 ? 1 : Math.max(0, 1 - (progress - 0.20) / 0.04);
    ref.current.visible = fade > 0.01;
    ref.current.scale.setScalar(0.95 + fade * 0.05);
  });
  return (
    <group ref={ref}>
      <GravityWellLighting />
      <GravityWellParticles progress={progress} isMobile={isMobile} />
      <AccretionRing progress={progress} />
      <DarkCore />
    </group>
  );
}

function ShatterGroup({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const fadeIn = progress < 0.18 ? 0 : Math.min(1, (progress - 0.18) / 0.04);
    const fadeOut = progress < 0.37 ? 1 : Math.max(0, 1 - (progress - 0.37) / 0.04);
    ref.current.visible = Math.min(fadeIn, fadeOut) > 0.01;
  });
  return (
    <group ref={ref}>
      <ShatterLighting />
      <CrystalCore progress={progress} />
      <ShardCloud progress={progress} isMobile={isMobile} />
      <ShockwaveRing progress={progress} />
    </group>
  );
}

function LatticeGroup({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const fadeIn = progress < 0.35 ? 0 : Math.min(1, (progress - 0.35) / 0.04);
    const fadeOut = progress < 0.54 ? 1 : Math.max(0, 1 - (progress - 0.54) / 0.04);
    ref.current.visible = Math.min(fadeIn, fadeOut) > 0.01;
  });
  return (
    <group ref={ref}>
      <LatticeLighting />
      <LatticeNodes progress={progress} isMobile={isMobile} />
      <LatticeEdges progress={progress} isMobile={isMobile} />
      <LatticePulses progress={progress} isMobile={isMobile} />
    </group>
  );
}

function ForgeGroup({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const fadeIn = progress < 0.52 ? 0 : Math.min(1, (progress - 0.52) / 0.04);
    const fadeOut = progress < 0.71 ? 1 : Math.max(0, 1 - (progress - 0.71) / 0.04);
    ref.current.visible = Math.min(fadeIn, fadeOut) > 0.01;
  });
  return (
    <group ref={ref}>
      <ForgeLighting />
      <ForgeStreams progress={progress} isMobile={isMobile} />
      <ForgeCrystals progress={progress} isMobile={isMobile} />
      <ForgeEmbers progress={progress} isMobile={isMobile} />
      <ForgeGlow progress={progress} />
    </group>
  );
}

function ConstellationGroup({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const fadeIn = progress < 0.69 ? 0 : Math.min(1, (progress - 0.69) / 0.04);
    ref.current.visible = fadeIn > 0.01;
  });
  return (
    <group ref={ref}>
      <ConstellationLighting />
      <ConstellationNebula progress={progress} isMobile={isMobile} />
      <ConstellationStars progress={progress} isMobile={isMobile} />
      <ConstellationLines progress={progress} isMobile={isMobile} />
      <CentralGlow progress={progress} />
    </group>
  );
}

/* === AMBIENT PARTICLES === */

function AmbientParticles({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 150 : 400;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return p;
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.2 + i * 0.5) * 0.001;
      arr[i * 3] += Math.cos(t * 0.15 + i * 0.3) * 0.0005;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#4a4a5a" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* === MAIN EXPORT === */

export default function Experience3D({ progress, isMobile = false }: SceneProps) {
  if (typeof window !== "undefined" && !detectWebGL()) {
    return <GradientFallback progress={progress} />;
  }

  return (
    <div className="fixed inset-0" style={{ zIndex: 1, width: "100vw", height: "100dvh" }}>
      <Canvas
        camera={{ position: [0, 0.5, 12], fov: isMobile ? 65 : 50, near: 0.1, far: 100 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !isMobile, powerPreference: isMobile ? "low-power" : "default", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={["#0a0a0e"]} />
        <fog attach="fog" args={["#0a0a0e", isMobile ? 12 : 10, isMobile ? 35 : 30]} />

        <MorphCamera progress={progress} isMobile={isMobile} />

        <GravityWellGroup progress={progress} isMobile={isMobile} />
        <ShatterGroup progress={progress} isMobile={isMobile} />
        <LatticeGroup progress={progress} isMobile={isMobile} />
        <ForgeGroup progress={progress} isMobile={isMobile} />
        <ConstellationGroup progress={progress} isMobile={isMobile} />

        <AmbientParticles isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
