'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { PlacedFurniture, FurnitureType } from '@/data/furnitureData';

// Furniture model imports
import Sofa from './models/Sofa';
import Table from './models/Table';
import Chair from './models/Chair';
import Lamp from './models/Lamp';
import Bookshelf from './models/Bookshelf';
import Bed from './models/Bed';
import Desk from './models/Desk';
import CustomBox from './models/CustomBox';

interface FurnitureProps {
  furniture: PlacedFurniture;
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (id: string, position: [number, number, number]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const FurnitureModels: Record<FurnitureType, React.ComponentType<{ color?: string; textures?: PlacedFurniture['textures'] }>> = {
  sofa: Sofa,
  table: Table,
  chair: Chair,
  lamp: Lamp,
  bookshelf: Bookshelf,
  bed: Bed,
  desk: Desk,
  custom: CustomBox,
};

export default function Furniture({ furniture, isSelected, onSelect, onUpdatePosition, onDragStart, onDragEnd }: FurnitureProps) {
  const groupRef = useRef<Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, gl } = useThree();

  const FurnitureModel = FurnitureModels[furniture.type];
  
  // Calculate scale based on dimensions if provided, otherwise default to 1,1,1
  // If furniture has dimensions, use them. If not (standard furniture), stick to 1,1,1
  const baseScale: [number, number, number] = furniture.dimensions || [1, 1, 1];
  
  // Apply selection scale effect
  const displayScale: [number, number, number] = isSelected 
    ? [baseScale[0] * 1.02, baseScale[1] * 1.02, baseScale[2] * 1.02]
    : baseScale;

  // Calculate selection ring radius based on dimensions
  const maxDim = Math.max(baseScale[0], baseScale[2]);
  // Standard furniture (no dimensions) usually fits within 1-2 units, so default radius 0.8 is fine
  // For custom dimensions, adapt radius
  const ringInnerRadius = furniture.dimensions ? maxDim / 2 + 0.1 : 0.8;
  const ringOuterRadius = furniture.dimensions ? maxDim / 2 + 0.3 : 1.0;
  const arrowDistance = furniture.dimensions ? maxDim / 2 + 0.2 : 0.9;

  const floorPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const intersection = useMemo(() => new Vector3(), []);
  const pointer = useMemo(() => new Vector2(), []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    onDragStart?.();
    onSelect();
    document.body.style.cursor = 'grabbing';
  }, [onSelect, onDragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
    document.body.style.cursor = 'auto';
  }, [onDragEnd]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !groupRef.current) return;
    
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    pointer.set(x, y);
    raycaster.setFromCamera(pointer, camera);
    
    if (raycaster.ray.intersectPlane(floorPlane, intersection)) {
      onUpdatePosition(furniture.instanceId, [
        intersection.x,
        0,
        intersection.z,
      ]);
    }
  }, [isDragging, gl.domElement, camera, floorPlane, raycaster, intersection, pointer, furniture.instanceId, onUpdatePosition]);

  return (
    <group
      ref={groupRef}
      position={furniture.position}
      rotation={[0, furniture.rotation, 0]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
    >
      {/* Selection indicator */}
      {isSelected && (
        <>
          {/* Ring indicator */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringInnerRadius, ringOuterRadius, 32]} />
            <meshBasicMaterial color="#9d4edd" transparent opacity={0.5} />
          </mesh>
          
          {/* Direction arrow */}
          <group position={[0, 0.02, arrowDistance]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.15, 0.3, 3]} />
              <meshBasicMaterial color="#ff6b9d" />
            </mesh>
          </group>
        </>
      )}
      
      {/* Furniture model */}
      <group scale={displayScale}>
        <FurnitureModel color={furniture.color} textures={furniture.textures} />
      </group>
    </group>
  );
}
