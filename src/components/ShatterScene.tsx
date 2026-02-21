/**
 * Scene II: The Shatter
 * A smooth crystalline sphere fractures and its fragments explode outward.
 * "Please fix it" -- the moment the 231-day pattern broke.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TRAIL_SEGMENTS = 3;

export function ShardCloud({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const SHARD_COUNT = isMobile ? 100 : 180;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, velocities, colors, rotations, sizes } = useMemo(() => {
    const totalPoints = SHARD_COUNT * (1 + TRAIL_SEGMENTS);
    const pos = new Float32Array(totalPoints * 3);
    const vel = new Float32Array(SHARD_COUNT * 3);
    const col = new Float32Array(totalPoints * 3);
    const rot = new Float32Array(SHARD_COUNT);
    const sz = new Float32Array(totalPoints);

    for (let i = 0; i < SHARD_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.2 + Math.random() * 0.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const baseIdx = i * (1 + TRAIL_SEGMENTS);
      pos[baseIdx * 3] = x;
      pos[baseIdx * 3 + 1] = y;
      pos[baseIdx * 3 + 2] = z;

      const speed = 2.5 + Math.random() * 5;
      vel[i * 3] = x / r * speed + (Math.random() - 0.5) * 0.8;
      vel[i * 3 + 1] = y / r * speed + (Math.random() - 0.5) * 0.8;
      vel[i * 3 + 2] = z / r * speed + (Math.random() - 0.5) * 0.8;

      const bright = 0.7 + Math.random() * 0.3;
      col[baseIdx * 3] = 0.95 * bright;
      col[baseIdx * 3 + 1] = 0.75 * bright;
      col[baseIdx * 3 + 2] = 0.4 * bright;

      sz[baseIdx] = isMobile ? 0.07 + Math.random() * 0.07 : 0.05 + Math.random() * 0.06;

      for (let t = 0; t < TRAIL_SEGMENTS; t++) {
        const tIdx = baseIdx + 1 + t;
        const fade = 1 - (t + 1) / (TRAIL_SEGMENTS + 1);
        col[tIdx * 3] = 0.95 * bright * fade;
        col[tIdx * 3 + 1] = 0.75 * bright * fade;
        col[tIdx * 3 + 2] = 0.4 * bright * fade;
        sz[tIdx] = sz[baseIdx] * fade * 0.6;
      }

      rot[i] = (Math.random() - 0.5) * 3;
    }
    return { positions: pos, velocities: vel, colors: col, rotations: rot, sizes: sz };
  }, [SHARD_COUNT, isMobile]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.20) / 0.15));
    const explodeT = Math.pow(sceneP, 0.55);
    const SHARD_COUNT = velocities.length / 3;

    for (let i = 0; i < SHARD_COUNT; i++) {
      const baseIdx = i * (1 + TRAIL_SEGMENTS);
      const ox = 0.3 * Math.sin(2.3 * i);
      const oy = 0.3 * Math.cos(1.7 * i);
      const oz = 0.3 * Math.sin(3.1 * i);

      const cx = ox + velocities[i * 3] * explodeT;
      const cy = oy + velocities[i * 3 + 1] * explodeT;
      const cz = oz + velocities[i * 3 + 2] * explodeT;

      const wobble = Math.sin(timeRef.current * rotations[i] + i) * 0.1 * explodeT;
      const wobbleY = Math.cos(timeRef.current * rotations[i] * 0.7 + i) * 0.08 * explodeT;

      arr[baseIdx * 3] = cx + wobble;
      arr[baseIdx * 3 + 1] = cy + wobbleY;
      arr[baseIdx * 3 + 2] = cz + wobble * 0.4;

      for (let t = 0; t < TRAIL_SEGMENTS; t++) {
        const tIdx = baseIdx + 1 + t;
        const trailT = 1 - (t + 1) / (TRAIL_SEGMENTS + 1);
        arr[tIdx * 3] = ox + (cx - ox) * trailT + wobble * trailT;
        arr[tIdx * 3 + 1] = oy + (cy - oy) * trailT + wobbleY * trailT;
        arr[tIdx * 3 + 2] = oz + (cz - oz) * trailT + wobble * 0.4 * trailT;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.09 : 0.07} vertexColors transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function ShockwaveRing({ progress }: { progress: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ringRef.current) return;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.20) / 0.15));

    const expandT = Math.pow(sceneP, 0.4);
    const scale = expandT * 6;
    ringRef.current.scale.set(scale, scale, 1);

    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    mat.opacity = sceneP < 0.05 ? sceneP / 0.05 * 0.3 : Math.max(0, 0.3 * (1 - (sceneP - 0.05) / 0.5));
    mat.emissiveIntensity = 0.8 + (1 - sceneP) * 1.5;

    ringRef.current.rotation.z += 0.002;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.02, 48, 128]} />
      <meshStandardMaterial
        color="#e8c99b"
        emissive="#e8c99b"
        emissiveIntensity={0.8}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function CrystalCore({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.20) / 0.15));

    const scale = Math.max(0.02, 1.2 - sceneP * 1.18);
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y += delta * 0.2;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.5 + sceneP * 2.5;
    mat.opacity = 1 - sceneP * 0.9;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 48, 48]} />
      <meshStandardMaterial color="#d4a574" emissive="#e8c99b" emissiveIntensity={0.5} transparent opacity={1} />
    </mesh>
  );
}

export function ShatterLighting() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 0]} intensity={2.0} color="#e8c99b" distance={14} decay={2} />
      <pointLight position={[3, 2, -2]} intensity={0.5} color="#8fa4b8" distance={15} decay={2} />
      <pointLight position={[-3, -1, 3]} intensity={0.3} color="#d4a574" distance={10} decay={2} />
    </>
  );
}
