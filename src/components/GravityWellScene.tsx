/**
 * Scene I: The Gravity Well
 * Particles trapped in a spiraling orbit around a dark center.
 * As scroll progresses, they tighten their orbit -- getting more stuck, not less.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function GravityWellParticles({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const COUNT = isMobile ? 1200 : 2200;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, sizes, baseAngles, baseRadii, baseHeights } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const angles = new Float32Array(COUNT);
    const radii = new Float32Array(COUNT);
    const heights = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.pow(Math.random(), 0.7) * 5;
      const height = (Math.random() - 0.5) * 3;

      angles[i] = angle;
      radii[i] = radius;
      heights[i] = height;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const t = radius / 5.8;
      col[i * 3] = 0.88 - t * 0.35;
      col[i * 3 + 1] = 0.68 - t * 0.35;
      col[i * 3 + 2] = 0.42 + t * 0.35;

      sz[i] = isMobile ? 0.03 + (1 - t) * 0.07 : 0.02 + (1 - t) * 0.06;
    }

    return { positions: pos, colors: col, sizes: sz, baseAngles: angles, baseRadii: radii, baseHeights: heights };
  }, [COUNT, isMobile]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const sizeAttr = meshRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const sArr = sizeAttr.array as Float32Array;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.03) / 0.15));

    for (let i = 0; i < COUNT; i++) {
      const baseAngle = baseAngles[i];
      const baseR = baseRadii[i];
      const baseH = baseHeights[i];

      const orbitSpeed = (0.3 + 2.0 / (baseR + 0.5)) * (1 + sceneP * 0.8);
      const angle = baseAngle + t * orbitSpeed;
      const radiusContraction = 1.0 - sceneP * 0.4;
      const r = baseR * radiusContraction;
      const heightScale = 1.0 - sceneP * 0.6;

      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = baseH * heightScale + Math.sin(t * 0.8 + i * 0.1) * 0.08;
      arr[i * 3 + 2] = Math.sin(angle) * r;

      const baseSize = sizes[i];
      sArr[i] = baseSize * (1 + sceneP * 0.4) + Math.sin(t * 2 + i * 0.3) * 0.005;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    meshRef.current.rotation.y = t * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[new Float32Array(sizes), 1]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.06 : 0.05} vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function AccretionRing({ progress }: { progress: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const sceneP = Math.max(0, Math.min(1, (progress - 0.03) / 0.15));

    ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
    ringRef.current.rotation.z = t * 0.05;

    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + Math.sin(t * 1.5) * 0.2 + sceneP * 0.3;
    mat.opacity = 0.12 + sceneP * 0.12 + Math.sin(t * 1.2) * 0.04;

    const scale = 1.0 - sceneP * 0.25;
    ringRef.current.scale.set(scale, scale, 1);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.2, 0.06, 48, 128]} />
      <meshStandardMaterial
        color="#d4a574"
        emissive="#e8c99b"
        emissiveIntensity={0.4}
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function DarkCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.04;
    meshRef.current.rotation.z += delta * 0.025;
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.015;
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + Math.sin(Date.now() * 0.002) * 0.06;
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.6, 48, 48]} />
        <meshStandardMaterial color="#0a0a0e" emissive="#1a0a2e" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.95, 48, 48]} />
        <meshStandardMaterial
          color="#0a0a0e"
          emissive="#4a3f6e"
          emissiveIntensity={0.12}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

export function GravityWellLighting() {
  return (
    <>
      <ambientLight intensity={0.03} />
      <pointLight position={[0, 0, 0]} intensity={1.0} color="#d4a574" distance={10} decay={2} />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#4a3f6e" distance={12} decay={2} />
      <pointLight position={[2, -1, 3]} intensity={0.2} color="#e8c99b" distance={8} decay={2} />
    </>
  );
}
