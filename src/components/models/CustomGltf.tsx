import React from 'react';
import { Gltf, Resize } from '@react-three/drei';

interface CustomGltfProps {
  url: string;
  dimensions?: [number, number, number];
  selected: boolean;
}

export function CustomGltf({ url, dimensions, selected }: CustomGltfProps) {
  return (
    <group>
      {/* Use Resize to ensure it fits reasonable bounds, or use raw if dimensions not set */}
      {/* For now, we wrap in Resize to scale it to roughly 1 meter if it's too huge/tiny? */}
      {/* Actually, user might want actual size. But safeguard is good. */}
      
      {/* If dimensions are provided (from resizing UI), we can scale it. */}
      {/* But <Gltf> handles loading. */}
      
      <Resize scale={dimensions ? undefined : 1}> 
        <Gltf src={url} castShadow receiveShadow />
      </Resize>
      
      {/* Selection Highlight */}
      {selected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
           <ringGeometry args={[0.5, 0.55, 32]} />
           <meshBasicMaterial color="#fbbf24" opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  );
}
