'use client';

import { useRef } from 'react';
import { Mesh, Group } from 'three';

interface SofaProps {
  color?: string;
}

export default function Sofa({ color = '#8B4513' }: SofaProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Seat base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Backrest */}
      <mesh position={[0, 0.6, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.7, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Left armrest */}
      <mesh position={[-0.9, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.4, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Right armrest */}
      <mesh position={[0.9, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.4, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Cushions */}
      <mesh position={[-0.45, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.7]} />
        <meshStandardMaterial color="#D4A574" roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.7]} />
        <meshStandardMaterial color="#D4A574" roughness={0.9} />
      </mesh>
      
      {/* Legs */}
      {[[-0.8, 0, 0.3], [0.8, 0, 0.3], [-0.8, 0, -0.3], [0.8, 0, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          <meshStandardMaterial color="#2C1810" metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
