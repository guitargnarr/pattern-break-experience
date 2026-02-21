/**
 * Scene V: The Constellation
 * Scattered points of light slowly resolve into a connected map.
 * LLC formed, clients paying, 69 sites live, 119 days from broken binary to business entity.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ConstellationStars({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const STAR_COUNT = isMobile ? 300 : 500;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { scatteredPositions, resolvedPositions, colors, twinklePhases, sizes } = useMemo(() => {
    const scattered = new Float32Array(STAR_COUNT * 3);
    const resolved = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    const twinkle = new Float32Array(STAR_COUNT);
    const sz = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      scattered[i * 3] = (Math.random() - 0.5) * 18;
      scattered[i * 3 + 1] = (Math.random() - 0.5) * 12;
      scattered[i * 3 + 2] = (Math.random() - 0.5) * 14;

      const ring = Math.floor(i / (STAR_COUNT / 5));
      const angleInRing = (i % (STAR_COUNT / 5)) / (STAR_COUNT / 5) * Math.PI * 2;
      const ringR = 1.5 + ring * 1.3;
      const ringY = (ring - 2) * 0.9;
      const jitter = 0.25;

      resolved[i * 3] = Math.cos(angleInRing) * ringR + (Math.random() - 0.5) * jitter;
      resolved[i * 3 + 1] = ringY + (Math.random() - 0.5) * jitter;
      resolved[i * 3 + 2] = Math.sin(angleInRing) * ringR + (Math.random() - 0.5) * jitter;

      const isHighlight = Math.random() > 0.8;
      if (isHighlight) {
        col[i * 3] = 0.95; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.9;
      } else if (Math.random() > 0.5) {
        col[i * 3] = 0.1; col[i * 3 + 1] = 0.78; col[i * 3 + 2] = 0.7;
      } else {
        col[i * 3] = 0.88; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 0.46;
      }

      twinkle[i] = Math.random() * Math.PI * 2;
      sz[i] = isMobile ? 0.06 + Math.random() * 0.08 : 0.04 + Math.random() * 0.06;
    }

    return { scatteredPositions: scattered, resolvedPositions: resolved, colors: col, twinklePhases: twinkle, sizes: sz };
  }, [STAR_COUNT, isMobile]);

  const currentPositions = useMemo(() => new Float32Array(STAR_COUNT * 3), [STAR_COUNT]);
  const currentSizes = useMemo(() => new Float32Array(STAR_COUNT), [STAR_COUNT]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.71) / 0.15));
    const converge = sceneP * sceneP * (3 - 2 * sceneP);

    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const sizeAttr = meshRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const sArr = sizeAttr.array as Float32Array;

    for (let i = 0; i < STAR_COUNT; i++) {
      for (let j = 0; j < 3; j++) {
        const idx = i * 3 + j;
        const target = scatteredPositions[idx] + (resolvedPositions[idx] - scatteredPositions[idx]) * converge;
        const drift = j === 1
          ? Math.sin(t * 0.3 + i * 0.7) * 0.05
          : Math.sin(t * 0.2 + i * 0.5 + j) * 0.08;
        arr[idx] = target + drift * (1 - converge * 0.7);
      }

      const twinkleVal = 0.7 + Math.sin(t * (1.5 + (i % 7) * 0.3) + twinklePhases[i]) * 0.3;
      sArr[i] = sizes[i] * (1 + converge * 0.8) * twinkleVal;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.015;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[currentPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[currentSizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.1 : 0.08} vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function ConstellationNebula({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const NEBULA_COUNT = isMobile ? 150 : 300;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(NEBULA_COUNT * 3);
    const col = new Float32Array(NEBULA_COUNT * 3);

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 8;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5;
      pos[i * 3 + 2] = r * Math.cos(phi);

      if (Math.random() > 0.5) {
        col[i * 3] = 0.05; col[i * 3 + 1] = 0.35; col[i * 3 + 2] = 0.4;
      } else {
        col[i * 3] = 0.15; col[i * 3 + 1] = 0.1; col[i * 3 + 2] = 0.3;
      }
    }

    return { positions: pos, colors: col };
  }, [NEBULA_COUNT]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.71) / 0.15));

    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = sceneP * 0.15;
    meshRef.current.rotation.y = timeRef.current * 0.008;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.35 : 0.25} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function ConstellationLines({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const CONNECTION_COUNT = isMobile ? 50 : 80;
  const lineRef = useRef<THREE.LineSegments>(null);
  const timeRef = useRef(0);

  const positions = useMemo(() => {
    const pos = new Float32Array(CONNECTION_COUNT * 6);
    for (let i = 0; i < CONNECTION_COUNT; i++) {
      const ring1 = Math.floor(Math.random() * 5);
      const ring2 = (ring1 + 1 + Math.floor(Math.random() * 2)) % 5;
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const r1 = 1.5 + ring1 * 1.3;
      const r2 = 1.5 + ring2 * 1.3;
      const y1 = (ring1 - 2) * 0.9;
      const y2 = (ring2 - 2) * 0.9;

      pos[i * 6] = Math.cos(angle1) * r1;
      pos[i * 6 + 1] = y1;
      pos[i * 6 + 2] = Math.sin(angle1) * r1;
      pos[i * 6 + 3] = Math.cos(angle2) * r2;
      pos[i * 6 + 4] = y2;
      pos[i * 6 + 5] = Math.sin(angle2) * r2;
    }
    return pos;
  }, [CONNECTION_COUNT]);

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    timeRef.current += delta;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.71) / 0.15));
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = Math.max(0, (sceneP - 0.3) * 1.0);
    lineRef.current.rotation.y = timeRef.current * 0.015;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#14b8a6" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

export function CentralGlow({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.71) / 0.15));
    const converge = sceneP * sceneP * (3 - 2 * sceneP);
    const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.15;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = converge * 1.2 * pulse;
    mat.opacity = converge * 0.35;
    meshRef.current.scale.setScalar(0.5 + converge * 1.5);
    meshRef.current.rotation.y += delta * 0.1;

    if (outerRef.current) {
      const oMat = outerRef.current.material as THREE.MeshStandardMaterial;
      oMat.emissiveIntensity = converge * 0.5 * pulse;
      oMat.opacity = converge * 0.08;
      outerRef.current.scale.setScalar(1 + converge * 4);
      outerRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#0a0a0e" emissive="#14b8a6" emissiveIntensity={0} transparent opacity={0} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={outerRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#0a0a0e" emissive="#5eead4" emissiveIntensity={0} transparent opacity={0} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

export function ConstellationLighting() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#14b8a6" distance={18} decay={2} />
      <pointLight position={[5, 3, -3]} intensity={0.6} color="#d4a574" distance={14} decay={2} />
      <pointLight position={[-4, -2, 4]} intensity={0.4} color="#5eead4" distance={12} decay={2} />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#8fa4b8" distance={10} decay={2} />
    </>
  );
}
