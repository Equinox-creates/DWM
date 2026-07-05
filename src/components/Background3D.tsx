import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial, PerformanceMonitor, Stars, Float, RoundedBox } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface FloatingShapeProps {
  position: [number, number, number];
  geometry: THREE.BufferGeometry;
  color: string;
  scale: number | [number, number, number];
  rotationSpeed: [number, number, number];
  floatSpeed: number;
}

const FloatingShape = ({ position, geometry, color, scale, rotationSpeed, floatSpeed }: FloatingShapeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [originalPosition] = useState(new THREE.Vector3(...position));
  const vec = new THREE.Vector3();

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Floating animation (sine wave)
    const t = state.clock.getElapsedTime() * floatSpeed;
    const floatY = Math.sin(t + position[0]) * 0.3;
    const floatX = Math.cos(t * 0.8 + position[1]) * 0.2;
    
    // Mouse interaction (drift away)
    const mouseX = (state.pointer.x * state.viewport.width) / 2;
    const mouseY = (state.pointer.y * state.viewport.height) / 2;
    
    const mouseVec = new THREE.Vector3(mouseX, mouseY, 0);
    const distance = meshRef.current.position.distanceTo(mouseVec);
    
    // Target position
    let targetX = originalPosition.x + floatX;
    let targetY = originalPosition.y + floatY;
    
    // Repel from mouse
    if (distance < 3) {
      const repelForce = (3 - distance) * 0.5;
      const dir = meshRef.current.position.clone().sub(mouseVec).normalize();
      targetX += dir.x * repelForce;
      targetY += dir.y * repelForce;
    }
    
    // Smoothly interpolate to target position
    meshRef.current.position.lerp(vec.set(targetX, targetY, originalPosition.z), 0.05);
    
    // Slow rotation
    meshRef.current.rotation.x += rotationSpeed[0];
    meshRef.current.rotation.y += rotationSpeed[1];
    meshRef.current.rotation.z += rotationSpeed[2];
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale} geometry={geometry}>
      <MeshTransmissionMaterial 
        backside
        samples={4}
        thickness={1}
        chromaticAberration={0.1}
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.3}
        temporalDistortion={0.1}
        color={color}
        roughness={0.15}
        transmission={1}
        ior={1.5}
      />
    </mesh>
  );
};

// Clyde Logo Centerpiece (High-Poly Glassmorphism)
const LogoModel = () => {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 0, -8]} scale={2.5}>
        {/* Main Head */}
        <RoundedBox args={[3, 2, 0.5]} radius={0.5} smoothness={16}>
          <MeshTransmissionMaterial 
            backside
            thickness={1} 
            roughness={0.05} 
            transmission={1} 
            ior={1.5} 
            chromaticAberration={0.04} 
            color="#5865F2" 
          />
        </RoundedBox>
        {/* Eyes */}
        <mesh position={[-0.6, 0.2, 0.26]}>
          <sphereGeometry args={[0.25, 64, 64]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.1} metalness={0.8} clearcoat={1} />
        </mesh>
        <mesh position={[0.6, 0.2, 0.26]}>
          <sphereGeometry args={[0.25, 64, 64]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.1} metalness={0.8} clearcoat={1} />
        </mesh>
        {/* Ears */}
        <mesh position={[-1, 1, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.5, 1, 64]} />
          <MeshTransmissionMaterial backside thickness={1} roughness={0.05} transmission={1} ior={1.5} color="#5865F2" />
        </mesh>
        <mesh position={[1, 1, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.5, 1, 64]} />
          <MeshTransmissionMaterial backside thickness={1} roughness={0.05} transmission={1} ior={1.5} color="#5865F2" />
        </mesh>
      </group>
    </Float>
  );
};

const Scene = () => {
  const { viewport } = useThree();
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.x = (state.pointer.x * viewport.width) / 2;
      lightRef.current.position.y = (state.pointer.y * viewport.height) / 2;
    }
  });

  const shapes = useMemo(() => {
    const dodecahedron = new THREE.DodecahedronGeometry(1);
    const octahedron = new THREE.OctahedronGeometry(1, 0); // Base for shard
    
    return [
      // Spread out further to avoid crowding
      { geo: dodecahedron, pos: [-8, 4, -4] as [number, number, number], color: '#8b5cf6', scale: 1.5, rot: [0.002, 0.003, 0] as [number, number, number], speed: 0.5 },
      { geo: octahedron, pos: [8, -3, -5] as [number, number, number], color: '#ec4899', scale: [1, 2, 1] as [number, number, number], rot: [0.005, 0.002, 0.001] as [number, number, number], speed: 0.7 }, // Shard
      { geo: octahedron, pos: [-6, -4, -3] as [number, number, number], color: '#3b82f6', scale: [0.8, 1.5, 0.8] as [number, number, number], rot: [0.001, 0.004, 0.002] as [number, number, number], speed: 0.6 }, // Shard
      { geo: dodecahedron, pos: [7, 5, -6] as [number, number, number], color: '#6366f1', scale: 1.8, rot: [0.003, 0.001, 0.002] as [number, number, number], speed: 0.4 },
      { geo: octahedron, pos: [0, -5, -4] as [number, number, number], color: '#a855f7', scale: [1.5, 3, 1.5] as [number, number, number], rot: [0.002, 0.005, 0] as [number, number, number], speed: 0.3 }, // Large Shard
      { geo: dodecahedron, pos: [9, 2, -3] as [number, number, number], color: '#8b5cf6', scale: 1.2, rot: [0.004, 0.002, 0.001] as [number, number, number], speed: 0.8 },
      { geo: octahedron, pos: [-9, 0, -5] as [number, number, number], color: '#ec4899', scale: [1.2, 2.5, 1.2] as [number, number, number], rot: [0.001, 0.003, 0.004] as [number, number, number], speed: 0.5 }, // Shard
    ];
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight ref={lightRef} intensity={10} color="#ffffff" distance={15} />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#a855f7" />
      <directionalLight position={[-10, -10, -5]} intensity={2} color="#3b82f6" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <LogoModel />
      
      {shapes.map((shape, i) => (
        <FloatingShape 
          key={i} 
          geometry={shape.geo} 
          position={shape.pos} 
          color={shape.color} 
          scale={shape.scale}
          rotationSpeed={shape.rot}
          floatSpeed={shape.speed}
        />
      ))}
      
      <Environment preset="studio" />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.2} />
      </EffectComposer>
    </>
  );
};

export const Background3D = () => {
  const [dpr, setDpr] = useState(1.5);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#120a1f] to-[#121212]" />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#0a0a0a] via-[#120a1f] to-[#0a121f]">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 60 }} 
        dpr={dpr}
        eventSource={document.getElementById('root') || undefined}
        eventPrefix="client"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <Scene />
      </Canvas>
    </div>
  );
};
