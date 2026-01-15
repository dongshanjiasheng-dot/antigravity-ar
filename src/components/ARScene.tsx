'use client';

import { useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, createXRStore, useXRHitTest, useXRPlanes } from '@react-three/xr';
import { Matrix4, Vector3, Group, Box3 } from 'three';
import * as THREE from 'three';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { PlacedFurniture, FurnitureType, FURNITURE_CATALOG } from '@/data/furnitureData';
import { CustomModel } from '@/hooks/useFurnitureStore';

// Furniture model imports
import Sofa from './models/Sofa';
import Table from './models/Table';
import Chair from './models/Chair';
import Lamp from './models/Lamp';
import Bookshelf from './models/Bookshelf';
import Bed from './models/Bed';
import Desk from './models/Desk';
import CustomBox from './models/CustomBox';

// Update type to accept textureUrl
const FurnitureModels: Record<FurnitureType, React.ComponentType<{ color?: string; textureUrl?: string }>> = {
  sofa: Sofa,
  table: Table,
  chair: Chair,
  lamp: Lamp,
  bookshelf: Bookshelf,
  bed: Bed,
  desk: Desk,
  custom: CustomBox,
};

// AR Workflow States
export type ARWorkflowState = 'scanning' | 'locked' | 'placing';

// Grid size options (in meters)
export const GRID_SIZES = [
  { label: '10cm', value: 0.1 },
  { label: '50cm', value: 0.5 },
  { label: '1m', value: 1.0 },
];

// @ts-expect-error - features not typed in older versions
export const xrStore = createXRStore({ features: ['hit-test', 'plane-detection', 'dom-overlay'], domOverlay: true });

// Reusable matrix and vector for hit test calculations
const hitTestMatrix = new Matrix4();
const hitTestPosition = new Vector3();

// Snap position to grid
function snapToGrid(position: Vector3, gridSize: number): Vector3 {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    position.y,
    Math.round(position.z / gridSize) * gridSize
  );
}

// Check collision between two bounding boxes
function checkCollision(
  newPos: [number, number, number],
  newDim: [number, number, number],
  existingFurniture: PlacedFurniture[]
): boolean {
  const newBox = new Box3(
    new Vector3(newPos[0] - newDim[0]/2, newPos[1], newPos[2] - newDim[2]/2),
    new Vector3(newPos[0] + newDim[0]/2, newPos[1] + newDim[1], newPos[2] + newDim[2]/2)
  );
  
  for (const item of existingFurniture) {
    const dim = item.dimensions || [1, 1, 1];
    const itemBox = new Box3(
      new Vector3(item.position[0] - dim[0]/2, item.position[1], item.position[2] - dim[2]/2),
      new Vector3(item.position[0] + dim[0]/2, item.position[1] + dim[1], item.position[2] + dim[2]/2)
    );
    if (newBox.intersectsBox(itemBox)) {
      return true; // Collision detected
    }
  }
  return false;
}

// Professional Grid Component
function ProGrid({ size, gridSize, color }: { size: number; gridSize: number; color: string }) {
  const divisions = Math.floor(size / gridSize);
  return (
    <gridHelper 
      args={[size, divisions, color, color]} 
      position={[0, 0.005, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Detected Planes Visualization (Floors/Walls)
function ARPlane({ plane }: { plane: any }) { 
  const ref = useRef<Group>(null);
  const [isVertical, setIsVertical] = useState(false);

  useFrame((state, delta, frame: any) => {
    if (!frame || !ref.current) return;
    // @ts-ignore
    const referenceSpace = xrStore.context.referenceSpace || state.gl.xr.getReferenceSpace();
    if (!referenceSpace) return;

    const pose = frame.getPose(plane.planeSpace, referenceSpace);
    if (pose) {
      ref.current.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
      ref.current.quaternion.set(pose.transform.orientation.x, pose.transform.orientation.y, pose.transform.orientation.z, pose.transform.orientation.w);
    }
    setIsVertical(plane.orientation === 'vertical');
  });

  return (
    <group ref={ref}>
       <mesh rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[1, 1]} />
         <meshBasicMaterial 
            color={isVertical ? '#3b82f6' : '#22c55e'} 
            transparent 
            opacity={0.3} 
            side={THREE.DoubleSide} 
         />
          {!isVertical && <gridHelper args={[10, 50, 'white', 'white']} rotation={[Math.PI/2, 0, 0]} position={[0, 0.01, 0]} />}
       </mesh>
       {isVertical && (
          <mesh position={[0, 0.5, 0.1]}>
             <planeGeometry args={[0.3, 0.1]} />
             <meshBasicMaterial color="blue" />
          </mesh>
       )}
    </group>
  );
}

function ARPlanes() {
  const planes = useXRPlanes();
  return (
    <>
      {Array.from(planes).map((plane: any, index: number) => (
        <ARPlane key={index} plane={plane} />
      ))}
    </>
  );
}

// Visual Reticle (No XR dependencies)
function VisualReticle({
  selectedType,
  selectedDimensions,
  gridSize,
  isLocked,
  visible,
  position,
  selectedTextureUrl
}: {
  selectedType: FurnitureType | null;
  selectedDimensions?: [number, number, number];
  gridSize: number;
  isLocked: boolean;
  visible: boolean;
  position: Vector3 | null;
  selectedTextureUrl?: string | null;
}) {
  if (!visible || !position || !selectedType) return null;

  const FurnitureModel = FurnitureModels[selectedType];
  const scale: [number, number, number] = selectedDimensions || [1, 1, 1];
  const maxDim = Math.max(scale[0], scale[2]);
  const gridDisplaySize = Math.max(maxDim * 2, 2);

  return (
    <group position={position}>
      {/* Professional Grid */}
      <ProGrid size={gridDisplaySize} gridSize={gridSize} color={isLocked ? '#22c55e' : '#3b82f6'} />
      
      {/* Center marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.03, 0.05, 32]} />
        <meshBasicMaterial color={isLocked ? '#22c55e' : '#3b82f6'} />
      </mesh>

      {/* Furniture Preview */}
      <group scale={scale}>
        <FurnitureModel 
          color={isLocked ? '#22c55e' : '#ffffff'} 
          textureUrl={selectedTextureUrl || undefined}
        />
      </group>
    </group>
  );
}

// Hit Test Reticle
function HitTestReticle({ 
  selectedType, 
  selectedDimensions, 
  gridSize,
  isLocked,
  lockedPosition,
  onHitUpdate,
  selectedTextureUrl 
}: { 
  selectedType: FurnitureType | null;
  selectedDimensions?: [number, number, number];
  gridSize: number;
  isLocked: boolean;
  lockedPosition: Vector3 | null;
  onHitUpdate: (isValid: boolean, position: Vector3 | null) => void;
  selectedTextureUrl?: string | null;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const lastUpdateRef = useRef<number>(0);
  
  useXRHitTest((results, getWorldMatrix) => {
    if (isLocked) return;
    const now = Date.now();
    
    if (results.length === 0) {
      if (isVisible) {
        setIsVisible(false);
        onHitUpdate(false, null);
      }
      return;
    }
    
    getWorldMatrix(hitTestMatrix, results[0]);
    hitTestPosition.setFromMatrixPosition(hitTestMatrix);
    const snappedPosition = snapToGrid(hitTestPosition, gridSize);
    
    if (!isVisible) setIsVisible(true);
    
    if (now - lastUpdateRef.current > 100) {
      onHitUpdate(true, snappedPosition);
      lastUpdateRef.current = now;
    }
  }, 'viewer');

  const displayPosition = isLocked ? lockedPosition : (isVisible ? snapToGrid(hitTestPosition, gridSize) : null);

  return (
    <VisualReticle 
      selectedType={selectedType}
      selectedDimensions={selectedDimensions}
      gridSize={gridSize}
      isLocked={isLocked}
      visible={!!displayPosition}
      position={displayPosition}
      selectedTextureUrl={selectedTextureUrl}
    />
  );
}

// Placed Furniture
function ARFurniture({ furniture, isColliding }: { furniture: PlacedFurniture; isColliding?: boolean }) {
  const FurnitureModel = FurnitureModels[furniture.type];
  const scale: [number, number, number] = furniture.dimensions || [1, 1, 1];

  return (
    <group 
      position={furniture.position}
      rotation={[0, furniture.rotation, 0]}
      scale={scale}
    >
      <FurnitureModel 
        color={isColliding ? '#ef4444' : furniture.color} 
        textureUrl={furniture.textureUrl}
      />
      {isColliding && (
        <mesh scale={[1.1, 1.1, 1.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}







// AR Scene content
function ARSceneContent({
  furniture,
  selectedType,
  selectedDimensions,
  gridSize,
  workflowState,
  lockedPosition,
  onHitUpdate,
  customTextureUrl,
}: {
  furniture: PlacedFurniture[];
  selectedType: FurnitureType | null;
  selectedDimensions?: [number, number, number];
  gridSize: number;
  workflowState: ARWorkflowState;
  lockedPosition: Vector3 | null;
  onHitUpdate: (isValid: boolean, position: Vector3 | null) => void;
  customTextureUrl?: string | null;
  inventory?: CustomModel[];
}) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />

      {/* Detected Planes Visualization */}
      <ARPlanes />

      <HitTestReticle 
        selectedType={selectedType}
        selectedDimensions={selectedDimensions}
        gridSize={gridSize}
        isLocked={workflowState === 'locked' || workflowState === 'placing'}
        lockedPosition={lockedPosition}
        onHitUpdate={onHitUpdate}
        selectedTextureUrl={customTextureUrl}
      />

      {furniture.map((item) => (
        <ARFurniture key={item.instanceId} furniture={item} />
      ))}
    </>
  );
}

interface ARSceneProps {
  furniture: PlacedFurniture[];
  selectedType: FurnitureType | null;
  selectedDimensions?: [number, number, number];
  onPlaceFurniture: (position: [number, number, number], rotation: number, textureUrl?: string, modelUrl?: string) => void;
  onSelectType: (type: FurnitureType, modelUrl?: string) => void;
  onUpdateDimensions: (dimensions: [number, number, number]) => void;
  onExitAR: () => void;
  inventory?: CustomModel[];
  addToInventory?: (model: Omit<CustomModel, 'id' | 'date'>) => void;
}

// ...



// Main AR Scene Component
// Main AR Scene Component
export default function ARScene({
  furniture,
  selectedType,
  selectedDimensions,
  onPlaceFurniture,
  onSelectType,
  onUpdateDimensions,
  onExitAR,
  inventory,
  addToInventory,
}: ARSceneProps) {
  // Workflow state
  const [workflowState, setWorkflowState] = useState<ARWorkflowState>('scanning');
  const [canPlace, setCanPlace] = useState(false);
  const [gridSize, setGridSize] = useState(0.1); // 10cm default
  const [showDimensionInput, setShowDimensionInput] = useState(false);
  const [dimensionInput, setDimensionInput] = useState({ w: 1000, h: 1000, d: 1000 }); // mm
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSimulation, setIsSimulation] = useState(false);
  const [isStarted, setIsStarted] = useState(false); // Track if user has started a mode
  const [customTextureUrl, setCustomTextureUrl] = useState<string | null>(null);
  const [isScanningObject, setIsScanningObject] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default

  const placementPositionRef = useRef<Vector3 | null>(null);
  const lockedPositionRef = useRef<Vector3 | null>(null);
  const [lockedPosition, setLockedPosition] = useState<Vector3 | null>(null);

  // Collision check
  const hasCollision = useMemo(() => {
    if (!lockedPosition || !selectedDimensions) return false;
    return checkCollision(
      [lockedPosition.x, lockedPosition.y, lockedPosition.z],
      selectedDimensions,
      furniture
    );
  }, [lockedPosition, selectedDimensions, furniture]);

  const handleEnterAR = useCallback(async () => {
    try {
      await xrStore.enterAR();
      setWorkflowState('scanning');
      setIsSimulation(false);
      setIsStarted(true);
    } catch (error) {
      console.error('Failed to enter AR:', error);
      // Auto-fallback to simulation
      const fallback = window.confirm('AR機能を開始できませんでした。\nデバッグモード(3Dシミュレーション)で開始しますか？');
      if (fallback) {
        setIsSimulation(true);
        setWorkflowState('scanning');
        setCanPlace(true);
        setIsStarted(true);
      }
    }
  }, []);

  const handleStartSimulation = useCallback(() => {
    setIsSimulation(true);
    setWorkflowState('scanning');
    setCanPlace(true);
    setIsStarted(true);
  }, []);

  // Handle Object Capture (Photo -> Furniture)
  const handleCaptureObject = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && addToInventory) {
        const url = URL.createObjectURL(file);
        // Simulate scanning process
        setIsScanningObject(true);
        setTimeout(() => {
          addToInventory({
            name: `スキャン物体 ${new Date().toLocaleTimeString()}`,
            textureUrl: url,
          });
          setIsScanningObject(false);
          alert('3Dモデルが生成され、リストに追加されました！\n(ARモードで配置できます)');
        }, 2000);
      }
    };
    input.click();
  }, [addToInventory]);

  const handleImportModel = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && addToInventory) {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      addToInventory({
        name: name,
        textureUrl: null,
        modelUrl: url,
      });
      // Alert user
      alert(`モデル "${name}" をインポートしました！\nリストから選択して配置できます。`);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addToInventory]);

  const handleHitUpdate = useCallback((isValid: boolean, position: Vector3 | null) => {
    if (isSimulation) return; // Handled by sim logic
    setCanPlace(isValid);
    if (position) {
      if (!placementPositionRef.current) {
        placementPositionRef.current = new Vector3();
      }
      placementPositionRef.current.copy(position);
    }
  }, [isSimulation]);

  // Simulation Hit Test Logic (Raycast to y=0)
  const SimulationHitTest = () => {
    useFrame((state) => {
      if (workflowState === 'locked' || workflowState === 'placing') return;
      
      // Raycast from camera center
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), state.camera);
      const floorPlane = new THREE.Plane(new Vector3(0, 1, 0), 0);
      const target = new Vector3();
      
      if (raycaster.ray.intersectPlane(floorPlane, target)) {
         setCanPlace(true);
         if (!placementPositionRef.current) placementPositionRef.current = new Vector3();
         placementPositionRef.current.copy(target);
         
         // Visual update handled by reticle using placementPositionRef in simulation mode?
         // Actually HitTestReticle uses internal state. Need to bridge it.
      }
    });
    return null;
  };

  const handleLock = useCallback(() => {
    if (canPlace && placementPositionRef.current) {
      lockedPositionRef.current = placementPositionRef.current.clone();
      setLockedPosition(lockedPositionRef.current);
      setWorkflowState('locked');
    }
  }, [canPlace]);

  const handleUnlock = useCallback(() => {
    setWorkflowState('scanning');
    setLockedPosition(null);
    lockedPositionRef.current = null;
  }, []);

  const handlePlace = useCallback(() => {
    if (lockedPositionRef.current && !hasCollision) {
      if (!selectedType) {
        setIsSidebarOpen(true);
        alert("配置する家具を選択してください");
        return;
      }
      const pos = lockedPositionRef.current;
      const texture = (selectedType === 'custom' && customTextureUrl) ? customTextureUrl : undefined;
      
      onPlaceFurniture([pos.x, pos.y, pos.z], 0, texture);
      
      setWorkflowState('scanning');
      setLockedPosition(null);
      lockedPositionRef.current = null;
    }
  }, [onPlaceFurniture, hasCollision, selectedType, customTextureUrl]);

  const handleApplyDimensions = useCallback(() => {
    const dims: [number, number, number] = [
      dimensionInput.w / 1000,
      dimensionInput.h / 1000,
      dimensionInput.d / 1000,
    ];
    onUpdateDimensions(dims);
    setShowDimensionInput(false);
  }, [dimensionInput, onUpdateDimensions]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Sidebar Toggle - Only show when started */}
      {/* Sidebar Toggle - Connected Tab Style */}
      {isStarted && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 z-[9999] h-12 flex items-center justify-center bg-slate-900/95 text-white border-y border-r border-slate-700 transition-all duration-300 shadow-xl ${ 
            isSidebarOpen ? 'left-64 rounded-r-xl border-l-0 w-12' : 'left-0 rounded-r-xl border-l-0 w-12'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>
      )}

      {/* Professional Sidebar */}
      {/* Professional Sidebar - High Z-index for AR */}
      <div className={`absolute left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700 z-[9990] flex flex-col py-4 transition-transform duration-300 ${
        isStarted && isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{ pointerEvents: 'auto' }}>
        
        <div className="px-4 mb-4">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">メニュー</h2>
          <button
            onClick={onExitAR}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            <span className="text-xl">←</span>
            <span className="font-bold">戻る</span>
          </button>
        </div>
        
        <div className="h-px bg-slate-800 mx-4 mb-4" />
        
        <div className="px-4 mb-6">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">ツール</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleEnterAR}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 transition"
            >
              <span className="text-2xl mb-1">📱</span>
              <span className="text-xs font-bold">AR再開</span>
            </button>
             <button
              onClick={handleStartSimulation}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition"
            >
              <span className="text-2xl mb-1">💻</span>
              <span className="text-xs font-bold">デバッグ</span>
            </button>
            <button
              onClick={handleImportModel}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-600/20 text-orange-400 hover:bg-orange-600/40 transition"
            >
              <span className="text-2xl mb-1">📂</span>
              <span className="text-xs font-bold">3D読込</span>
            </button>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".glb,.gltf"
              className="hidden"
            />
            <button
              onClick={() => setShowDimensionInput(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition"
            >
              <span className="text-2xl mb-1">📏</span>
              <span className="text-xs font-bold">サイズ変更</span>
            </button>
          </div>
        </div>

        <div className="px-4 mb-6">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">グリッド (床)</h2>
          <div className="flex gap-2">
            {GRID_SIZES.map((g) => (
              <button
                key={g.value}
                onClick={() => setGridSize(g.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                  gridSize === g.value 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col px-4">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">家具リスト</h2>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {/* Inventory Items */}
            {inventory?.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCustomTextureUrl(item.textureUrl);
                  onSelectType('custom', item.modelUrl || undefined);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                  selectedType === 'custom' && customTextureUrl === item.textureUrl
                    ? 'bg-orange-600/20 border-orange-500 text-white' 
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/50">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   {item.textureUrl ? (
                     <img src={item.textureUrl} alt={item.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="flex items-center justify-center h-full text-lg">📸</span>
                   )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold truncate max-w-[120px]">{item.name}</span>
                  <span className="text-[10px] text-orange-400">スキャン済み</span>
                </div>
              </button>
            ))}

            {/* Standard Catalog */}
            {FURNITURE_CATALOG.filter(f => f.id !== 'custom').map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectType(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                  selectedType === item.id 
                    ? 'bg-purple-600/20 border-purple-500 text-white' 
                    : 'bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-bold">{item.nameJa}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanning Overlay */}
       {isScanningObject && (
         <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center">
           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <h2 className="text-2xl font-bold text-white animate-pulse">3Dモデル生成中...</h2>
           <p className="text-slate-400 mt-2">AIが形状を解析しています</p>
         </div>
       )}

       {/* START SCREEN - shown when no mode is active */}
      {!isStarted && (
        <div className="absolute inset-0 z-[55] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">🏠 AR インテリア</h1>
            <p className="text-slate-400 text-lg">モードを選択してください</p>
          </div>
          


          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mb-8">
            {/* Object Scan Button (Priority) */}
            <button
              onClick={handleCaptureObject}
              className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl shadow-orange-500/30 hover:scale-105 transition-transform"
            >
              <span className="text-5xl mb-4">📸</span>
              <span className="text-2xl font-bold mb-2">物体スキャン</span>
              <span className="text-sm text-orange-100">実物を撮影して3D化</span>
            </button>
          </div>

          <p className="text-slate-400 mb-4 font-bold">- または -</p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            {/* AR Mode Button */}
            <button
              onClick={handleEnterAR}
              className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-transform"
            >
              <span className="text-3xl mb-2">📱</span>
              <span className="font-bold">配置のみ (AR)</span>
            </button>
            
            {/* Simulation Button */}
            <button
              onClick={handleStartSimulation}
              className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-transform"
            >
              <span className="text-3xl mb-2">💻</span>
              <span className="font-bold">配置のみ (Sim)</span>
            </button>
          </div>


          
          <p className="mt-12 text-slate-500 text-sm text-center">
            ※ ARモードが起動しない場合は自動的に3Dシミュレーションに切り替わります
          </p>
        </div>
      )}

      {/* Canvas Layer */}
      <div className="w-full h-full bg-slate-900">
        <Canvas>
          <Suspense fallback={null}>
          {isSimulation ? (
            <>
               <PerspectiveCamera makeDefault position={[0, 1.6, 2]} />
               <OrbitControls makeDefault target={[0, 0, 0]} />
               <gridHelper args={[20, 20, 0x444444, 0x222222]} />
               <SimulationHitTest />
               {/* Show reticle based on placementPositionRef for simulation */}
               {selectedType && canPlace && (workflowState === 'scanning') && (
                 <VisualReticle 
                   selectedType={selectedType}
                   selectedDimensions={selectedDimensions}
                   gridSize={gridSize}
                   isLocked={false}
                   visible={true}
                   position={placementPositionRef.current || new Vector3()}
                   selectedTextureUrl={customTextureUrl} 
                 />
               )}
            </>
          ) : (
            <XR store={xrStore}>
               <ARSceneContent
                furniture={furniture}
                selectedType={selectedType}
                selectedDimensions={selectedDimensions}
                gridSize={gridSize}
                workflowState={workflowState}
                lockedPosition={lockedPosition}
                onHitUpdate={handleHitUpdate}
                customTextureUrl={customTextureUrl}
                inventory={inventory}
               />
            </XR>
          )}

           {/* Always render placed furniture and locked reticle if simulating or locked */}
           {(isSimulation || workflowState !== 'scanning') && furniture.map((item) => (
             <ARFurniture key={item.instanceId} furniture={item} />
           ))}
           
           {isSimulation && workflowState !== 'scanning' && lockedPosition && selectedType && (
              <VisualReticle
                 selectedType={selectedType}
                 selectedDimensions={selectedDimensions}
                 gridSize={gridSize}
                 isLocked={true}
                 visible={true}
                 position={lockedPosition}
                 selectedTextureUrl={customTextureUrl}
               />
           )}
           
           <ambientLight intensity={1} />
           <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          </Suspense>
        </Canvas>
      </div>

      {/* Bottom Control Panel */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-300 ${
        isSidebarOpen ? 'pl-72' : 'pl-6'
      }`}>
        {/* Status Steps */}
        {/* Connected Steps */}
        <div className="relative flex items-center justify-between max-w-sm mx-auto mb-8 px-4">
          {/* Connecting Line */}
          <div className="absolute left-4 right-4 top-1/2 h-1 bg-slate-700 -z-10 rounded-full" />
          <div className="absolute left-4 top-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500" 
               style={{ 
                 width: workflowState === 'scanning' ? '0%' : (workflowState === 'locked' ? '50%' : '100%'), 
                 right: 'auto' 
               }}
          />

          {/* Step 1 */}
          <div className={`flex flex-col items-center gap-1 ${
             workflowState === 'scanning' || workflowState === 'locked' || workflowState === 'placing' ? 'text-white' : 'text-slate-500'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300 ${
               workflowState === 'scanning' ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-600'
            }`}>
              1
            </div>
            <span className="text-[10px] font-bold">スキャン</span>
          </div>

          {/* Step 2 */}
          <div className={`flex flex-col items-center gap-1 ${
             workflowState === 'locked' || workflowState === 'placing' ? 'text-white' : 'text-slate-500'
          }`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300 ${
               workflowState === 'locked' || workflowState === 'placing' ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-slate-600'
            }`}>
              2
            </div>
            <span className="text-[10px] font-bold">ロック</span>
          </div>

          {/* Step 3 */}
          <div className={`flex flex-col items-center gap-1 ${
             workflowState === 'placing' ? 'text-white' : 'text-slate-500'
          }`}>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300 ${
               workflowState === 'placing' ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-600'
            }`}>
              3
            </div>
            <span className="text-[10px] font-bold">配置</span>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="flex justify-center gap-4">
          {workflowState === 'scanning' && (
            <div className="flex gap-2">
              <button
                onClick={handleLock}
                className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition transform active:scale-95 ${
                  canPlace 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50' 
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {canPlace ? '🔒 位置を決定 (ロック)' : '床を認識中...'}
              </button>
              
              {/* Finish Button */}
              {furniture.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("3Dビュワーで確認しますか？")) {
                      setIsSimulation(true);
                      setWorkflowState('scanning'); 
                    }
                  }}
                  className="px-4 py-4 rounded-2xl font-bold bg-slate-700 text-white hover:bg-slate-600 border border-slate-600 shadow-lg"
                  title="作成完了"
                >
                  ✅ 完了
                </button>
              )}
            </div>
          )}
          
          {workflowState === 'locked' && (
            <>
              <button
                onClick={handleUnlock}
                className="px-6 py-4 rounded-2xl font-bold bg-slate-700 text-white hover:bg-slate-600 transition shadow-lg"
              >
                🔄 やり直し
              </button>
              <button
                onClick={handlePlace}
                disabled={hasCollision}
                className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition transform active:scale-95 ${
                  hasCollision 
                    ? 'bg-red-900/80 text-red-200 cursor-not-allowed' 
                    : (!selectedType ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/50')
                }`}
              >
                {hasCollision ? '⚠️ 衝突しています' : (!selectedType ? '🪑 家具を選択' : '✓ ここに配置')}
              </button>
            </>
          )}
        </div>

        {/* Dimension Update Launcher */}
        {selectedDimensions && (
          <button 
             onClick={() => setShowDimensionInput(true)}
             className="mt-6 mx-auto block px-4 py-2 rounded-lg bg-black/40 border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition"
          >
            サイズ: {(selectedDimensions[0] * 1000).toFixed(0)}mm × {(selectedDimensions[1] * 1000).toFixed(0)}mm × {(selectedDimensions[2] * 1000).toFixed(0)}mm
            <span className="ml-2 text-blue-400 text-xs">変更 &gt;</span>
          </button>
        )}
      </div>

      {/* Input Modal */}
      {showDimensionInput && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
            <h3 className="text-white text-lg font-bold mb-4">寸法を入力 (mm)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">幅 (Width)</label>
                <input
                  type="number"
                  value={dimensionInput.w}
                  onChange={(e) => setDimensionInput(d => ({ ...d, w: Number(e.target.value) }))}
                  className="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">高さ (Height)</label>
                <input
                  type="number"
                  value={dimensionInput.h}
                  onChange={(e) => setDimensionInput(d => ({ ...d, h: Number(e.target.value) }))}
                  className="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">奥行き (Depth)</label>
                <input
                  type="number"
                  value={dimensionInput.d}
                  onChange={(e) => setDimensionInput(d => ({ ...d, d: Number(e.target.value) }))}
                  className="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white text-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDimensionInput(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition"
              >
                キャンセル
              </button>
              <button
                onClick={handleApplyDimensions}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition shadow-lg"
              >
                適用する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

