'use client';

import { useRef } from 'react';
import { Group } from 'three';

interface ChairProps {
  color?: string;
}

export default function Chair({ color = '#CD853F' }: ChairProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Backrest */}
      <mesh position={[0, 0.8, -0.22]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.65, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Legs */}
      {[[-0.2, 0.21, 0.2], [0.2, 0.21, 0.2], [-0.2, 0.21, -0.2], [0.2, 0.21, -0.2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.05, 0.42, 0.05]} />
          <meshStandardMaterial color="#3D2914" roughness={0.8} />
        </mesh>
      ))}
      
      {/* Back support bars */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.65, -0.22]} castShadow>
          <boxGeometry args={[0.04, 0.35, 0.04]} />
          <meshStandardMaterial color="#3D2914" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
