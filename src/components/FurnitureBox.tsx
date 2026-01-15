'use client';

import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface FurnitureBoxProps {
  position?: [number, number, number];
  color?: string;
  size?: [number, number, number];
}

export default function FurnitureBox({ 
  position = [0, 0.5, 0], 
  color = '#ff6b6b',
  size = [1, 1, 1]
}: FurnitureBoxProps) {
  const meshRef = useRef<Mesh>(null);

  // Optional: Add subtle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
    </mesh>
  );
}
