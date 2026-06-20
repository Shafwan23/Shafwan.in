'use client';
/* eslint-disable react-hooks/purity, react-hooks/immutability */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Sparkles, Stars, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════
   UTILITY: Extract unique icosahedron vertices
   ═══════════════════════════════════════════════ */
function getIcoVertices(radius: number): THREE.Vector3[] {
  const geo = new THREE.IcosahedronGeometry(radius, 0);
  const pos = geo.getAttribute('position');
  const verts: THREE.Vector3[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const key = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
    if (!seen.has(key)) { seen.add(key); verts.push(v); }
  }
  geo.dispose();
  return verts;
}

/* ═══════════════════════════════════════════════
   OUTER SHELL — Wireframe icosahedron with
   glowing edges + vertex constellation nodes
   ═══════════════════════════════════════════════ */
function OuterShell() {
  const wireRef = useRef<THREE.Group>(null);
  const vertices = useMemo(() => getIcoVertices(3.2), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (wireRef.current) {
      wireRef.current.rotation.y = t * 0.04;
      wireRef.current.rotation.x = Math.sin(t * 0.08) * 0.1 + 0.3;
    }
  });

  return (
    <group ref={wireRef}>
      {/* Wireframe edges — the visible structure */}
      <lineSegments>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(3.2, 0)]} />
        <lineBasicMaterial color="#7dd3fc" transparent opacity={0.6} linewidth={1} />
      </lineSegments>

      {/* Extremely subtle glass solid for refraction hint */}
      <mesh>
        <icosahedronGeometry args={[3.18, 0]} />
        <meshPhysicalMaterial
          color="#e0e7ff"
          transparent
          opacity={0.03}
          roughness={0}
          metalness={0.1}
          transmission={0.95}
          ior={1.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertex constellation nodes — glowing dots at each vertex */}
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.9} />
          {/* Glow halo around each node */}
          <pointLight position={[0, 0, 0]} intensity={0.3} color="#c4b5fd" distance={1.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   INNER WIREFRAME SHELL — smaller, offset rotation
   ═══════════════════════════════════════════════ */
function InnerShell() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = -t * 0.06;
      ref.current.rotation.z = t * 0.04;
    }
  });

  return (
    <group ref={ref}>
      <lineSegments>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(2.0, 0)]} />
        <lineBasicMaterial color="#818cf8" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ENERGY CORE — bright central sphere with pulse
   ═══════════════════════════════════════════════ */
function EnergyCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = Math.sin(t * 1.2) * 0.15 + 0.85;
    if (coreRef.current) {
      coreRef.current.scale.setScalar(0.5 * pulse);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.8 + Math.sin(t * 0.6) * 0.3);
    }
    if (matRef.current) {
      matRef.current.opacity = 0.08 + Math.sin(t * 0.8) * 0.04;
    }
  });

  return (
    <group>
      {/* Bright core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#c7d2fe" transparent opacity={0.95} />
      </mesh>

      {/* Inner glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial ref={matRef} color="#818cf8" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {/* Intense core illumination */}
      <pointLight position={[0, 0, 0]} intensity={8} color="#a78bfa" distance={10} />
      <pointLight position={[0, 0, 0]} intensity={4} color="#67e8f9" distance={6} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" distance={4} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   INTERNAL GALAXY — nebula + star particles
   inside the artifact
   ═══════════════════════════════════════════════ */
function InternalGalaxy() {
  const nebulaRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const dustCount = 400;
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      // Constrain particles within a sphere of radius ~2.5
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 2.2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y = t * 0.02;
      nebulaRef.current.rotation.z = t * 0.015;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = -t * 0.03;
      dustRef.current.rotation.x = t * 0.01;
    }
  });

  return (
    <group>
      {/* Nebula cloud — soft emissive sphere */}
      <mesh ref={nebulaRef}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial color="#4338ca" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>

      {/* Second nebula layer — different color */}
      <mesh rotation={[1, 0.5, 0]}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#7e22ce" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Internal star particles */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#e0e7ff"
          transparent
          opacity={0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Brighter core sparkles */}
      <Sparkles count={60} scale={3} size={4} speed={0.8} opacity={0.6} color="#c4b5fd" />
      <Sparkles count={30} scale={2} size={6} speed={1.2} opacity={0.8} color="#67e8f9" />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ORBITAL PLATFORM — glowing rings beneath
   the artifact
   ═══════════════════════════════════════════════ */
function OrbitalPlatform() {
  const ringGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringGroup.current) {
      ringGroup.current.rotation.y = t * 0.02;
    }
  });

  return (
    <group ref={ringGroup} position={[0, -3.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Primary ring */}
      <mesh>
        <ringGeometry args={[3.8, 4.0, 128]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Secondary ring — wider */}
      <mesh>
        <ringGeometry args={[4.5, 4.6, 128]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Tertiary ring — outermost */}
      <mesh>
        <ringGeometry args={[5.2, 5.25, 128]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>

      {/* Disc glow — the illuminated platform surface */}
      <mesh>
        <circleGeometry args={[3.8, 128]} />
        <meshBasicMaterial color="#312e81" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>

      {/* Radial light pulse */}
      <pointLight position={[0, 0, -0.5]} intensity={2} color="#6366f1" distance={8} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ENERGY CONNECTIONS — lines extending from
   artifact vertices outward into space
   ═══════════════════════════════════════════════ */
function EnergyConnections() {
  const ref = useRef<THREE.Group>(null);
  const vertices = useMemo(() => getIcoVertices(3.2), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y = t * 0.04;
      ref.current.rotation.x = Math.sin(t * 0.08) * 0.1 + 0.3;
    }
  });

  // Select 6 vertices spread out for connection lines
  const selectedVerts = useMemo(() => {
    return vertices.filter((_, i) => i % 2 === 0).slice(0, 6);
  }, [vertices]);

  return (
    <group ref={ref}>
      {selectedVerts.map((v, i) => {
        const direction = v.clone().normalize();
        const end = direction.multiplyScalar(7);
        return (
          <Line
            key={i}
            points={[v.toArray(), end.toArray()]}
            color="#6366f1"
            lineWidth={0.5}
            transparent
            opacity={0.12}
          />
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   AMBIENT DEPTH PARTICLES — 4 depth layers
   ═══════════════════════════════════════════════ */
function DepthParticles() {
  const foregroundRef = useRef<THREE.Points>(null);

  // Layer 1: Foreground particles (close to camera)
  const fgCount = 150;
  const fgPositions = useMemo(() => {
    const pos = new Float32Array(fgCount * 3);
    for (let i = 0; i < fgCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 + 4; // closer to camera
    }
    return pos;
  }, []);

  // Layer 4: Deep background dust
  const bgCount = 600;
  const bgPositions = useMemo(() => {
    const pos = new Float32Array(bgCount * 3);
    for (let i = 0; i < bgCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 15; // far behind
    }
    return pos;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (foregroundRef.current) {
      foregroundRef.current.rotation.y = t * 0.008;
    }
  });

  return (
    <>
      {/* Layer 1: Foreground — bright, close, large */}
      <points ref={foregroundRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fgPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#c4b5fd"
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 4: Deep background nebula dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bgPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          color="#4338ca"
          transparent
          opacity={0.25}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
}

/* ═══════════════════════════════════════════════
   CAMERA DRIFT — subtle cinematic movement
   ═══════════════════════════════════════════════ */
function CameraDrift() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.04) * 0.4;
    camera.position.y = Math.cos(t * 0.06) * 0.25;
    camera.lookAt(0, -0.3, 0);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   MAIN CANVAS EXPORT
   ═══════════════════════════════════════════════ */
export default function AmbientCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0.5, 9], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Environment preset="night" />
          <fog attach="fog" args={['#0a0a2e', 18, 45]} />

          {/* Cinematic lighting rig */}
          <ambientLight intensity={0.15} color="#1e1b4b" />
          <directionalLight position={[8, 12, 5]} intensity={1.5} color="#8b5cf6" />
          <directionalLight position={[-6, -8, -5]} intensity={1.2} color="#06b6d4" />
          <directionalLight position={[0, -5, -8]} intensity={1} color="#4f46e5" />
          {/* Rim light from behind */}
          <directionalLight position={[0, 3, -10]} intensity={0.8} color="#c4b5fd" />

          {/* ─── THE ARTIFACT ─── */}
          <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.4}>
            <group position={[0, 0.2, 0]} scale={1.25}>
              <OuterShell />
              <InnerShell />
              <EnergyCore />
              <InternalGalaxy />
              <EnergyConnections />
            </group>
          </Float>

          {/* ─── ORBITAL PLATFORM ─── */}
          <OrbitalPlatform />

          {/* ─── DEPTH LAYERS ─── */}
          <DepthParticles />

          {/* Layer 3/4: Deep space star field */}
          <Stars radius={70} depth={80} count={3500} factor={4} saturation={0.15} fade speed={0.4} />

          {/* Mid-field sparkles */}
          <Sparkles count={80} scale={22} size={2} speed={0.15} opacity={0.2} color="#8b5cf6" />
          <Sparkles count={50} scale={18} size={1.5} speed={0.3} opacity={0.25} color="#06b6d4" />

          <CameraDrift />

          {/* Post-processing */}
          <EffectComposer>
            <Bloom
              intensity={1.8}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.95}
              mipmapBlur
            />
            <Vignette
              offset={0.25}
              darkness={0.65}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
