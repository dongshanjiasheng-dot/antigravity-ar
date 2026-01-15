'use client';

import { useRef } from 'react';
import { Group } from 'three';

interface DeskProps {
  color?: string;
}

export default function Desk({ color = '#A0522D' }: DeskProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Desktop */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* Left drawer unit */}
      <mesh position={[-0.5, 0.37, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.7, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Drawer handles */}
      {[0.55, 0.35, 0.15].map((y, i) => (
        <mesh key={i} position={[-0.5, y, 0.32]} castShadow>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      
      {/* Right legs */}
      <mesh position={[0.6, 0.37, 0.28]} castShadow>
        <boxGeometry args={[0.06, 0.74, 0.06]} />
        <meshStandardMaterial color="#4A3728" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.37, -0.28]} castShadow>
        <boxGeometry args={[0.06, 0.74, 0.06]} />
        <meshStandardMaterial color="#4A3728" roughness={0.8} />
      </mesh>
      
      {/* Monitor */}
      <mesh position={[0.2, 1.0, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      
      {/* Monitor screen */}
      <mesh position={[0.2, 1.0, -0.18]}>
        <boxGeometry args={[0.55, 0.35, 0.01]} />
        <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.1} />
      </mesh>
      
      {/* Monitor stand */}
      <mesh position={[0.2, 0.8, -0.2]} castShadow>
        <boxGeometry args={[0.08, 0.1, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.76, -0.2]} castShadow>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
      </mesh>
      
      {/* Keyboard */}
      <mesh position={[0.2, 0.78, 0.1]} castShadow>
        <boxGeometry args={[0.4, 0.02, 0.15]} />
        <meshStandardMaterial color="#2C2C2C" roughness={0.5} />
      </mesh>
    </group>
  );
}
