/**
 * Scene III: The Lattice
 * Nodes appear one by one, then edges connect them -- a growing network.
 * 45 repos, 69 sites, 85 models, 24 skills assembling into architecture.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const EDGE_COUNT = 120;

// Shared deterministic node positions
function generateNodePositions(count: number): THREE.Vector3[] {
  const nPos: THREE.Vector3[] = [];
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = 1.5 + rand() * 3.8;
    nPos.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta) * 0.6,
      r * Math.cos(phi)
    ));
  }
  return nPos;
}

export function LatticeNodes({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const NODE_COUNT = isMobile ? 50 : 80;
  const meshRef = useRef<THREE.Points>(null);
  const haloRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, birthOrder, sizes } = useMemo(() => {
    const nPos = generateNodePositions(NODE_COUNT);
    const pos = new Float32Array(NODE_COUNT * 3);
    const col = new Float32Array(NODE_COUNT * 3);
    const birth = new Float32Array(NODE_COUNT);
    const sz = new Float32Array(NODE_COUNT);

    for (let i = 0; i < NODE_COUNT; i++) {
      pos[i * 3] = nPos[i].x;
      pos[i * 3 + 1] = nPos[i].y;
      pos[i * 3 + 2] = nPos[i].z;

      birth[i] = i / NODE_COUNT;

      const t = birth[i];
      col[i * 3] = 0.08 + t * 0.75;
      col[i * 3 + 1] = 0.72 - t * 0.07;
      col[i * 3 + 2] = 0.66 - t * 0.20;

      sz[i] = isMobile ? 0.1 + Math.random() * 0.1 : 0.08 + Math.random() * 0.08;
    }

    return { positions: pos, colors: col, birthOrder: birth, sizes: sz };
  }, [NODE_COUNT, isMobile]);

  const haloColors = useMemo(() => {
    const col = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      const t = i / NODE_COUNT;
      col[i * 3] = 0.08 + t * 0.75;
      col[i * 3 + 1] = 0.72 - t * 0.07;
      col[i * 3 + 2] = 0.66 - t * 0.20;
    }
    return col;
  }, [NODE_COUNT]);

  const currentSizes = useMemo(() => new Float32Array(NODE_COUNT).fill(0), [NODE_COUNT]);
  const haloSizes = useMemo(() => new Float32Array(NODE_COUNT).fill(0), [NODE_COUNT]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.37) / 0.15));
    const sizeAttr = meshRef.current.geometry.attributes.size as THREE.BufferAttribute;
    const sArr = sizeAttr.array as Float32Array;

    for (let i = 0; i < NODE_COUNT; i++) {
      const appear = Math.max(0, Math.min(1, (sceneP - birthOrder[i] * 0.8) / 0.1));
      const breathe = 1 + Math.sin(timeRef.current * 2.5 + i * 1.3) * 0.12;
      const popIn = appear < 1 ? 1 + (1 - appear) * 0.4 : 1;
      sArr[i] = sizes[i] * appear * breathe * popIn;
    }
    sizeAttr.needsUpdate = true;

    if (haloRef.current) {
      const haloAttr = haloRef.current.geometry.attributes.size as THREE.BufferAttribute;
      const hArr = haloAttr.array as Float32Array;
      for (let i = 0; i < NODE_COUNT; i++) {
        const appear = Math.max(0, Math.min(1, (sceneP - birthOrder[i] * 0.8) / 0.1));
        const pulse = 1 + Math.sin(timeRef.current * 1.8 + i * 0.9) * 0.2;
        hArr[i] = sizes[i] * 2.5 * appear * pulse;
      }
      haloAttr.needsUpdate = true;
      haloRef.current.rotation.y = timeRef.current * 0.03;
    }

    meshRef.current.rotation.y = timeRef.current * 0.03;
  });

  return (
    <>
      <points ref={haloRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(positions), 3]} />
          <bufferAttribute attach="attributes-color" args={[haloColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[haloSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial size={0.3} vertexColors transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[currentSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>
    </>
  );
}

export function LatticeEdges({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const NODE_COUNT = isMobile ? 50 : 80;
  const lineRef = useRef<THREE.LineSegments>(null);
  const timeRef = useRef(0);

  const { positions } = useMemo(() => {
    const nPos = generateNodePositions(NODE_COUNT);

    const edges: [number, number][] = [];
    for (let i = 0; i < NODE_COUNT && edges.length < EDGE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT && edges.length < EDGE_COUNT; j++) {
        if (nPos[i].distanceTo(nPos[j]) < 3.2) {
          edges.push([i, j]);
        }
      }
    }

    const pos = new Float32Array(edges.length * 6);
    for (let e = 0; e < edges.length; e++) {
      const [a, b] = edges[e];
      pos[e * 6] = nPos[a].x; pos[e * 6 + 1] = nPos[a].y; pos[e * 6 + 2] = nPos[a].z;
      pos[e * 6 + 3] = nPos[b].x; pos[e * 6 + 4] = nPos[b].y; pos[e * 6 + 5] = nPos[b].z;
    }

    return { positions: pos };
  }, [NODE_COUNT]);

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    timeRef.current += delta;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.37) / 0.15));
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const edgeAppear = Math.max(0, sceneP - 0.15) / 0.85;
    mat.opacity = edgeAppear * 0.5;

    lineRef.current.rotation.y = timeRef.current * 0.03;
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

export function LatticePulses({ progress, isMobile }: { progress: number; isMobile: boolean }) {
  const NODE_COUNT = isMobile ? 50 : 80;
  const PULSE_COUNT = isMobile ? 30 : 60;
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const { positions, colors, edgePairs } = useMemo(() => {
    const nPos = generateNodePositions(NODE_COUNT);
    const edges: [THREE.Vector3, THREE.Vector3][] = [];

    for (let i = 0; i < NODE_COUNT && edges.length < EDGE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT && edges.length < EDGE_COUNT; j++) {
        if (nPos[i].distanceTo(nPos[j]) < 3.2) {
          edges.push([nPos[i].clone(), nPos[j].clone()]);
        }
      }
    }

    const pos = new Float32Array(PULSE_COUNT * 3);
    const col = new Float32Array(PULSE_COUNT * 3);
    const pairs = new Float32Array(PULSE_COUNT * 2);

    for (let i = 0; i < PULSE_COUNT; i++) {
      const edgeIdx = Math.floor(Math.random() * edges.length);
      const phase = Math.random();
      pairs[i * 2] = edgeIdx;
      pairs[i * 2 + 1] = phase;

      col[i * 3] = 0.3;
      col[i * 3 + 1] = 0.95;
      col[i * 3 + 2] = 0.85;
    }

    return { positions: pos, colors: col, edgePairs: { pairs, edges } };
  }, [NODE_COUNT, PULSE_COUNT]);

  useFrame(() => {
    if (!meshRef.current) return;
    timeRef.current += 0.016;

    const sceneP = Math.max(0, Math.min(1, (progress - 0.37) / 0.15));
    const posAttr = meshRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    const pulseOpacity = Math.max(0, sceneP - 0.3) / 0.7;

    for (let i = 0; i < PULSE_COUNT; i++) {
      const edgeIdx = Math.floor(edgePairs.pairs[i * 2]);
      const basePhase = edgePairs.pairs[i * 2 + 1];
      const edge = edgePairs.edges[edgeIdx];
      if (!edge) continue;

      const t = (basePhase + timeRef.current * 0.4) % 1;
      arr[i * 3] = edge[0].x + (edge[1].x - edge[0].x) * t;
      arr[i * 3 + 1] = edge[0].y + (edge[1].y - edge[0].y) * t;
      arr[i * 3 + 2] = edge[0].z + (edge[1].z - edge[0].z) * t;
    }

    posAttr.needsUpdate = true;

    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = pulseOpacity * 0.6;
    meshRef.current.rotation.y = timeRef.current * 0.03;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={isMobile ? 0.07 : 0.05} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export function LatticeLighting() {
  return (
    <>
      <ambientLight intensity={0.06} />
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#14b8a6" distance={14} decay={2} />
      <pointLight position={[-3, -1, 2]} intensity={0.5} color="#d4a574" distance={10} decay={2} />
      <pointLight position={[4, 0, -3]} intensity={0.4} color="#5eead4" distance={12} decay={2} />
    </>
  );
}
