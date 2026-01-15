'use client';

import { useRef } from 'react';
import { Group } from 'three';

interface TableProps {
  color?: string;
}

export default function Table({ color = '#DEB887' }: TableProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Table top */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* Legs */}
      {[[-0.5, 0.18, 0.25], [0.5, 0.18, 0.25], [-0.5, 0.18, -0.25], [0.5, 0.18, -0.25]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.08, 0.36, 0.08]} />
          <meshStandardMaterial color="#5D4E37" roughness={0.7} />
        </mesh>
      ))}
      
      {/* Lower shelf */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.04, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}
