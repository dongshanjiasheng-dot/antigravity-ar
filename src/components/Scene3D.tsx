'use client';

import { forwardRef, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useTexture } from '@react-three/drei';
import { Plane, Raycaster, Vector2, Vector3, Group, RepeatWrapping } from 'three';
import { PlacedFurniture, FurnitureType } from '@/data/furnitureData';
import { RoomSettings } from '@/hooks/useFurnitureStore';

// Furniture model imports
import Sofa from './models/Sofa';
import Table from './models/Table';
import Chair from './models/Chair';
import Lamp from './models/Lamp';
import Bookshelf from './models/Bookshelf';
import Bed from './models/Bed';
import Desk from './models/Desk';
import CustomBox from './models/CustomBox';
import Furniture from './Furniture';

const FurnitureModels: Record<FurnitureType, React.ComponentType<{ color?: string }>> = {
  sofa: Sofa,
  table: Table,
  chair: Chair,
  lamp: Lamp,
  bookshelf: Bookshelf,
  bed: Bed,
  desk: Desk,
  custom: CustomBox,
};

// Component to handle texture loading and application
function TexturedMaterial({ url, repeat = 1 }: { url: string, repeat?: number }) {
  const texture = useTexture(url);
  
  const configuredTexture = useMemo(() => {
    const t = texture.clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.needsUpdate = true;
    return t;
  }, [texture, repeat]);
  
  return <meshStandardMaterial map={configuredTexture} roughness={0.8} />;
}

// Room component with walls and floor
function Room({ settings }: { settings: RoomSettings }) {
  const SIZE = 20; // Room size
  const HEIGHT = 5; // Wall height

  return (
    <group receiveShadow>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[SIZE, SIZE]} />
        {settings.floorTexture ? (
          <TexturedMaterial url={settings.floorTexture} repeat={4} />
        ) : (
          <meshStandardMaterial color={settings.floorColor} roughness={0.8} />
        )}
      </mesh>

      {/* Walls - Creating a corner environment */}
      {/* Back Wall */}
      <mesh position={[0, HEIGHT/2, -SIZE/2]} receiveShadow>
        <planeGeometry args={[SIZE, HEIGHT]} />
        {settings.wallTexture ? (
          <TexturedMaterial url={settings.wallTexture} repeat={2} />
        ) : (
          <meshStandardMaterial color={settings.wallColor} roughness={0.5} />
        )}
      </mesh>

      {/* Side Wall (Left) */}
      <mesh position={[-SIZE/2, HEIGHT/2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[SIZE, HEIGHT]} />
        {settings.wallTexture ? (
          <TexturedMaterial url={settings.wallTexture} repeat={2} />
        ) : (
          <meshStandardMaterial color={settings.wallColor} roughness={0.5} />
        )}
      </mesh>
      
      {/* Side Wall (Right) - maybe omit for better visibility or make double sided */}
      <mesh position={[SIZE/2, HEIGHT/2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
         <planeGeometry args={[SIZE, HEIGHT]} />
         {settings.wallTexture ? (
          <TexturedMaterial url={settings.wallTexture} repeat={2} />
        ) : (
          <meshStandardMaterial color={settings.wallColor} roughness={0.5} />
        )}
      </mesh>
    </group>
  );
}

// Component that handles placement mode
function PlacementHandler({ 
  placingFurnitureId, 
  placingFurniture, 
  onUpdatePosition,
  onConfirmPlacement 
}: {
  placingFurnitureId: string | null;
  placingFurniture: PlacedFurniture | undefined;
  onUpdatePosition: (id: string, position: [number, number, number]) => void;
  onConfirmPlacement: () => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  
  const floorPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const intersection = useMemo(() => new Vector3(), []);
  const pointer = useMemo(() => new Vector2(), []);

  // Update position on mouse move
  useFrame(({ mouse }) => {
    if (!placingFurnitureId || !placingFurniture) return;
    
    pointer.set(mouse.x, mouse.y);
    raycaster.setFromCamera(pointer, camera);
    
    if (raycaster.ray.intersectPlane(floorPlane, intersection)) {
      onUpdatePosition(placingFurnitureId, [
        intersection.x,
        0,
        intersection.z,
      ]);
    }
  });

  // Handle click to confirm placement
  const handleClick = useCallback(() => {
    if (placingFurnitureId) {
      onConfirmPlacement();
    }
  }, [placingFurnitureId, onConfirmPlacement]);

  if (!placingFurnitureId || !placingFurniture) return null;

  const FurnitureModel = FurnitureModels[placingFurniture.type];
  
  // Calculate scale based on dimensions if provided
  const baseScale: [number, number, number] = placingFurniture.dimensions || [1, 1, 1];
  const maxDim = Math.max(baseScale[0], baseScale[2]);
  const ringInnerRadius = placingFurniture.dimensions ? maxDim / 2 + 0.1 : 0.9;
  const ringOuterRadius = placingFurniture.dimensions ? maxDim / 2 + 0.3 : 1.1;

  return (
    <group
      ref={groupRef}
      position={placingFurniture.position}
      onClick={handleClick}
    >
      {/* Placement indicator ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringInnerRadius, ringOuterRadius, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
      </mesh>
      
      {/* Ghost preview of furniture */}
      <group scale={baseScale}>
        <FurnitureModel color={placingFurniture.color} />
      </group>
    </group>
  );
}

// Invisible floor plane for placement position tracking (no click handler - button only)
function PlacementFloor({ placingFurnitureId }: {
  placingFurnitureId: string | null;
}) {
  if (!placingFurnitureId) return null;

  // This mesh exists only to help with raycasting for position tracking
  // Placement is confirmed via the "配置完了" button only
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.001, 0]}
    >
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

interface Scene3DProps {
  furniture: PlacedFurniture[];
  placingFurnitureId: string | null;
  selectedId: string | null;
  roomSettings: RoomSettings;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  onUpdatePosition: (id: string, position: [number, number, number]) => void;
  onConfirmPlacement: () => void;
  onSelectFurniture: (id: string | null) => void;
  children?: React.ReactNode;
}

const Scene3D = forwardRef<HTMLCanvasElement, Scene3DProps>(({ 
  furniture,
  placingFurnitureId,
  selectedId,
  roomSettings,
  isDragging,
  setIsDragging,
  onUpdatePosition,
  onConfirmPlacement,
  onSelectFurniture,
  children 
}, ref) => {
  const placingFurniture = useMemo(() => 
    furniture.find(f => f.instanceId === placingFurnitureId),
    [furniture, placingFurnitureId]
  );

  const handleCanvasClick = useCallback(() => {
    // Only deselect if not in placement mode
    if (!placingFurnitureId) {
      onSelectFurniture(null);
    }
  }, [placingFurnitureId, onSelectFurniture]);

  return (
    <Canvas
      ref={ref}
      camera={{ position: [6, 4, 6], fov: 50 }}
      gl={{ preserveDrawingBuffer: true }}
      shadows
      onPointerMissed={handleCanvasClick}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-3, 5, -3]} intensity={0.4} />
        <hemisphereLight args={['#87CEEB', '#8B4513', 0.3]} />

        {/* Background color */}
        <color attach="background" args={['#111111']} />

        {/* Room Environment (Walls & Floor) */}
        <Room settings={roomSettings} />

        {/* Grid floor overlay */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={2}
          sectionThickness={1}
          sectionColor={placingFurnitureId ? "#00ff88" : "#9d4edd"}
          fadeDistance={20}
          infiniteGrid
          position={[0, 0.01, 0]} // Slightly above floor
        />

        {/* Floor plane for placement position tracking */}
        <PlacementFloor 
          placingFurnitureId={placingFurnitureId} 
        />

        {/* Camera controls - disable during placement OR dragging */}
        <OrbitControls
          makeDefault
          enabled={!placingFurnitureId && !isDragging}
          enablePan={!placingFurnitureId}
          enableZoom={true}
          enableRotate={!placingFurnitureId && !isDragging}
          maxPolarAngle={Math.PI / 2.1} // Prevent going below floor
          minDistance={2}
          maxDistance={20}
        />

        {/* Placed furniture (excluding the one being placed) */}
        {furniture
          .filter(item => item.instanceId !== placingFurnitureId)
          .map((item) => (
            <Furniture 
              key={item.instanceId} 
              furniture={item}
              isSelected={selectedId === item.instanceId}
              onSelect={() => onSelectFurniture(item.instanceId)}
              onUpdatePosition={onUpdatePosition}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            />
          ))}

        {/* Placement handler for furniture being placed */}
        <PlacementHandler 
          placingFurnitureId={placingFurnitureId}
          placingFurniture={placingFurniture}
          onUpdatePosition={onUpdatePosition}
          onConfirmPlacement={onConfirmPlacement}
        />

        {/* Additional children */}
        {children}
      </Suspense>
    </Canvas>
  );
});

Scene3D.displayName = 'Scene3D';

export default Scene3D;
