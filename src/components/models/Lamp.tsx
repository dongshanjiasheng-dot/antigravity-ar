'use client';

import { useRef } from 'react';
import { Group } from 'three';

interface LampProps {
  color?: string;
}

export default function Lamp({ color = '#FFD700' }: LampProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef}>
      {/* Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.06, 16]} />
        <meshStandardMaterial color="#2C2C2C" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Pole */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
        <meshStandardMaterial color="#4A4A4A" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Lamp shade */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 0.35, 16, 1, true]} />
        <meshStandardMaterial color={color} side={2} roughness={0.9} />
      </mesh>
      
      {/* Lamp shade top */}
      <mesh position={[0, 1.67, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      
      {/* Light bulb (emissive) */}
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color="#FFFACD" 
          emissive="#FFFACD" 
          emissiveIntensity={0.5} 
        />
      </mesh>
      
      {/* Point light */}
      <pointLight position={[0, 1.4, 0]} color="#FFF8DC" intensity={0.5} distance={3} />
    </group>
  );
}
