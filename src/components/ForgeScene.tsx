/**
 * Scene IV: The Forge
 * Molten streams of particles flow through invisible channels, cooling into solid forms.
 * Real work: RetailMyMeds data (41,775 pharmacies), Clementine migration, cinematic PDFs.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ForgeStreams({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const STREAM_COUNT = isMobile ? 600 : 1000;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, streamData } = useMemo(() => {
    const pos = new Float32Array(STREAM_COUNT * 3);
    const col = new Float32Array(STREAM_COUNT * 3);
    const data = new Float32Array(STREAM_COUNT * 4);

    for (let i = 0; i < STREAM_COUNT; i++) {
      const stream = Math.floor(Math.random() * 4);
      const phase = Math.random();
      const speed = 0.4 + Math.random() * 1.8;
      const spread = (Math.random() - 0.5) * 0.5;

      data[i * 4] = stream;
      data[i * 4 + 1] = speed;
      data[i * 4 + 2] = phase;
      data[i * 4 + 3] = spread;

      const t = phase;
      const [x, y, z] = getStreamPosition(stream, t, spread);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const heat = 1 - t;
      col[i * 3] = 0.95 - heat * 0.1;
      col[i * 3 + 1] = 0.55 + heat * 0.35;
      col[i * 3 + 2] = 0.15 + heat * 0.15;
    }

    return { positions: pos, colors: col, streamData: data };
  }, [STREAM_COUNT]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = meshRef.current.geometry.attributes.color as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const cArr = colAttr.array as Float32Array;
    const STREAM_COUNT = streamData.length / 4;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.54) / 0.15));

    for (let i = 0; i < STREAM_COUNT; i++) {
      const stream = streamData[i * 4];
      const speed = streamData[i * 4 + 1];
      const phase = streamData[i * 4 + 2];
      const spread = streamData[i * 4 + 3];

      const t = (phase + timeRef.current * speed * 0.18) % 1;
      const flowIntensity = 0.3 + sceneP * 0.7;
      const convergeFactor = 1 - sceneP * 0.5;
      const [x, y, z] = getStreamPosition(stream, t, spread * convergeFactor);

      arr[i * 3] = x * flowIntensity + x * (1 - flowIntensity) * 0.3;
      arr[i * 3 + 1] = y + Math.sin(timeRef.current * 0.5 + i * 0.02) * 0.05 * (1 - t);
      arr[i * 3 + 2] = z * flowIntensity + z * (1 - flowIntensity) * 0.3;

      const heat = (1 - t) * (0.5 + sceneP * 0.5);
      const nearCenter = 1 - t;
      cArr[i * 3] = 0.85 + heat * 0.15;
      cArr[i * 3 + 1] = 0.4 + heat * 0.45 + nearCenter * 0.1;
      cArr[i * 3 + 2] = 0.1 + heat * 0.25;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.05 : 0.04} vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function ForgeEmbers({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const EMBER_COUNT = isMobile ? 100 : 200;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, velocities } = useMemo(() => {
    const pos = new Float32Array(EMBER_COUNT * 3);
    const col = new Float32Array(EMBER_COUNT * 3);
    const vel = new Float32Array(EMBER_COUNT * 3);

    for (let i = 0; i < EMBER_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      vel[i * 3] = (Math.random() - 0.5) * 2;
      vel[i * 3 + 1] = 0.5 + Math.random() * 2;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 2;

      col[i * 3] = 0.95 + Math.random() * 0.05;
      col[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      col[i * 3 + 2] = 0.1 + Math.random() * 0.15;
    }

    return { positions: pos, colors: col, velocities: vel };
  }, [EMBER_COUNT]);

  useFrame(() => {
    if (!meshRef.current) return;
    timeRef.current += 0.016;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.54) / 0.15));
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const EMBER_COUNT = velocities.length / 3;

    for (let i = 0; i < EMBER_COUNT; i++) {
      const life = (timeRef.current * 0.3 + i / EMBER_COUNT) % 1;

      arr[i * 3] = velocities[i * 3] * life * 0.8 + Math.sin(timeRef.current + i) * 0.1;
      arr[i * 3 + 1] = velocities[i * 3 + 1] * life * 0.6;
      arr[i * 3 + 2] = velocities[i * 3 + 2] * life * 0.8 + Math.cos(timeRef.current + i) * 0.1;
    }

    posAttr.needsUpdate = true;

    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = sceneP * 0.6;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.03 : 0.025} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function ForgeGlow({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.54) / 0.15));
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
    mat.emissiveIntensity = sceneP * 1.0 * pulse;
    mat.opacity = sceneP * 0.15;
    meshRef.current.scale.setScalar(0.8 + sceneP * 1.5);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial
        color="#0a0a0e"
        emissive="#f97316"
        emissiveIntensity={0}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function getStreamPosition(stream: number, t: number, spread: number): [number, number, number] {
  const origins: [number, number, number][] = [
    [-5.5, 2.5, -3.5],
    [5.5, 2, -2.5],
    [-4.5, -2, 3.5],
    [4.5, -2.5, 2.5],
  ];
  const target: [number, number, number] = [0, 0, 0];
  const [ox, oy, oz] = origins[stream] || origins[0];

  const ease = t * t * (3 - 2 * t);
  const x = ox + (target[0] - ox) * ease + Math.sin(t * Math.PI * 2.5) * spread;
  const y = oy + (target[1] - oy) * ease + Math.sin(t * Math.PI * 3.5) * spread * 0.5;
  const z = oz + (target[2] - oz) * ease + Math.cos(t * Math.PI * 2) * spread;

  return [x, y, z];
}

export function ForgeCrystals({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const CRYSTAL_COUNT = isMobile ? 18 : 30;
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const crystalData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CRYSTAL_COUNT; i++) {
      const theta = (i / CRYSTAL_COUNT) * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.9;
      const yJitter = (Math.random() - 0.5) * 1.5;
      data.push({
        position: [Math.cos(theta) * r, yJitter, Math.sin(theta) * r] as [number, number, number],
        scale: 0.06 + Math.random() * 0.14,
        birthTime: 0.25 + (i / CRYSTAL_COUNT) * 0.65,
        rotSpeed: (Math.random() - 0.5) * 0.6,
      });
    }
    return data;
  }, [CRYSTAL_COUNT]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.54) / 0.15));

    groupRef.current.children.forEach((child, i) => {
      const d = crystalData[i];
      if (!d) return;
      const appear = Math.max(0, Math.min(1, (sceneP - d.birthTime) / 0.1));
      const overshoot = appear < 1 ? appear * (1 + (1 - appear) * 0.25) : 1;
      child.scale.setScalar(d.scale * overshoot);
      child.rotation.y += delta * d.rotSpeed;
      child.rotation.x += delta * d.rotSpeed * 0.2;

      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.3 + appear * 0.7;
        mat.opacity = appear * 0.85;
      }
    });

    groupRef.current.rotation.y = timeRef.current * 0.02;
  });

  return (
    <group ref={groupRef}>
      {crystalData.map((d, i) => (
        <mesh key={i} position={d.position}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#d4a574" emissive="#f97316" emissiveIntensity={0.3} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

export function ForgeLighting() {
  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#f97316" distance={12} decay={2} />
      <pointLight position={[-3, 2, 0]} intensity={0.6} color="#d4a574" distance={12} decay={2} />
      <pointLight position={[3, -1, 2]} intensity={0.5} color="#e8c99b" distance={10} decay={2} />
      <pointLight position={[0, 3, -2]} intensity={0.3} color="#f97316" distance={8} decay={2} />
    </>
  );
}
