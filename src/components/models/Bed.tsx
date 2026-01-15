'use client';

import { useRef } from 'react';
import { Group } from 'three';

interface BedProps {
  color?: string;
}

export default function Bed({ color = '#F5F5DC' }: BedProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Frame base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.15, 2.2]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      
      {/* Mattress */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.25, 2.1]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      
      {/* Headboard */}
      <mesh position={[0, 0.7, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.9, 0.1]} />
        <meshStandardMaterial color="#4E342E" roughness={0.7} />
      </mesh>
      
      {/* Pillows */}
      <mesh position={[-0.4, 0.6, -0.75]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </mesh>
      <mesh position={[0.4, 0.6, -0.75]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </mesh>
      
      {/* Blanket */}
      <mesh position={[0, 0.56, 0.35]} castShadow>
        <boxGeometry args={[1.45, 0.08, 1.3]} />
        <meshStandardMaterial color="#6B5B95" roughness={0.9} />
      </mesh>
      
      {/* Legs */}
      {[[-0.7, 0.06, 1.0], [0.7, 0.06, 1.0], [-0.7, 0.06, -0.95], [0.7, 0.06, -0.95]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
          <meshStandardMaterial color="#3E2723" metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
