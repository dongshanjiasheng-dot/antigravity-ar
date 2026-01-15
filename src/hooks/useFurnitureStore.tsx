'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FurnitureType, PlacedFurniture, getFurnitureDefinition } from '@/data/furnitureData';

export interface RoomSettings {
  wallColor: string;
  floorColor: string;
  wallTexture?: string;
  floorTexture?: string;
}

export interface CustomModel {
  id: string;
  name: string;
  textureUrl: string | null;
  date: number;
}

interface FurnitureContextType {
  furniture: PlacedFurniture[];
  selectedId: string | null;
  placingFurnitureId: string | null; // ID of furniture being placed
  roomSettings: RoomSettings;
  addFurniture: (
    type: FurnitureType, 
    dimensions?: [number, number, number],
    textures?: PlacedFurniture['textures'],
    initialPosition?: [number, number, number],
    textureUrl?: string
  ) => string; // Returns instance ID
  removeFurniture: (instanceId: string) => void;
  updateFurniturePosition: (instanceId: string, position: [number, number, number]) => void;
  rotateFurniture: (instanceId: string, rotation: number) => void;
  selectFurniture: (instanceId: string | null) => void;
  confirmPlacement: () => void; // Confirm placement and switch to edit mode
  cancelPlacement: () => void; // Cancel placement and remove furniture
  updateWallColor: (color: string) => void;
  updateFloorColor: (color: string) => void;
  updateWallTexture: (url: string | null) => void;
  updateFloorTexture: (url: string | null) => void;
  resetAll: () => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  inventory: CustomModel[];
  addToInventory: (model: Omit<CustomModel, 'id' | 'date'>) => void;
}

export const FurnitureContext = createContext<FurnitureContextType | null>(null);

let instanceCounter = 0;

export function FurnitureProvider({ children }: { children: ReactNode }) {
  const [furniture, setFurniture] = useState<PlacedFurniture[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingFurnitureId, setPlacingFurnitureId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    wallColor: '#f3f4f6', // gray-100 default
    floorColor: '#2b2b2b', // dark floor default for grid visibility
  });
  const [inventory, setInventory] = useState<CustomModel[]>([]);

  const addFurniture = useCallback((
    type: FurnitureType, 
    dimensions?: [number, number, number],
    textures?: PlacedFurniture['textures'],
    initialPosition?: [number, number, number],
    textureUrl?: string
  ): string => {
    const definition = getFurnitureDefinition(type);
    if (!definition) return '';

    const instanceId = `${type}-${++instanceCounter}`;
    const newFurniture: PlacedFurniture = {
      instanceId,
      type,
      position: initialPosition || [0, 0, 0], // Start at center or provided position
      rotation: 0,
      color: definition.defaultColor,
      dimensions: dimensions, // Include dimensions if provided
      textures: textures, // Include textures if provided
      textureUrl: textureUrl, // Include textureUrl if provided
    };

    setFurniture((prev) => [...prev, newFurniture]);
    setPlacingFurnitureId(instanceId); // Enter placement mode
    setSelectedId(null); // Deselect any current selection
    
    return instanceId;
  }, []);

  const removeFurniture = useCallback((instanceId: string) => {
    setFurniture((prev) => prev.filter((f) => f.instanceId !== instanceId));
    setSelectedId((prev) => (prev === instanceId ? null : prev));
    setPlacingFurnitureId((prev) => (prev === instanceId ? null : prev));
  }, []);

  const updateFurniturePosition = useCallback(
    (instanceId: string, position: [number, number, number]) => {
      setFurniture((prev) =>
        prev.map((f) => (f.instanceId === instanceId ? { ...f, position } : f))
      );
    },
    []
  );

  const rotateFurniture = useCallback((instanceId: string, rotation: number) => {
    setFurniture((prev) =>
      prev.map((f) => (f.instanceId === instanceId ? { ...f, rotation } : f))
    );
  }, []);

  const selectFurniture = useCallback((instanceId: string | null) => {
    // Only allow selection if not in placement mode
    if (!placingFurnitureId) {
      setSelectedId(instanceId);
    }
  }, [placingFurnitureId]);

  const confirmPlacement = useCallback(() => {
    if (placingFurnitureId) {
      setSelectedId(placingFurnitureId); // Select the placed furniture
      setPlacingFurnitureId(null); // Exit placement mode
    }
  }, [placingFurnitureId]);

  const cancelPlacement = useCallback(() => {
    if (placingFurnitureId) {
      setFurniture((prev) => prev.filter((f) => f.instanceId !== placingFurnitureId));
      setPlacingFurnitureId(null);
    }
  }, [placingFurnitureId]);

  const updateWallColor = useCallback((color: string) => {
    setRoomSettings((prev) => ({ ...prev, wallColor: color, wallTexture: undefined }));
  }, []);

  const updateFloorColor = useCallback((color: string) => {
    setRoomSettings((prev) => ({ ...prev, floorColor: color, floorTexture: undefined }));
  }, []);

  const updateWallTexture = useCallback((url: string | null) => {
    setRoomSettings((prev) => ({ ...prev, wallTexture: url || undefined }));
  }, []);

  const updateFloorTexture = useCallback((url: string | null) => {
    setRoomSettings((prev) => ({ ...prev, floorTexture: url || undefined }));
  }, []);

  const resetAll = useCallback(() => {
    setFurniture([]);
    setSelectedId(null);
    setPlacingFurnitureId(null);
    setRoomSettings({
      wallColor: '#f3f4f6',
      floorColor: '#2b2b2b',
    });
  }, []);

  const addToInventory = useCallback((model: Omit<CustomModel, 'id' | 'date'>) => {
    const newItem: CustomModel = {
      ...model,
      id: `generated-${Date.now()}`,
      date: Date.now(),
    };
    setInventory(prev => [newItem, ...prev]);
  }, []);

  return (
    <FurnitureContext.Provider
      value={{
        furniture,
        selectedId,
        placingFurnitureId,
        roomSettings,
        addFurniture,
        removeFurniture,
        updateFurniturePosition,
        rotateFurniture,
        selectFurniture,
        confirmPlacement,
        cancelPlacement,
        updateWallColor,
        updateFloorColor,
        updateWallTexture,
        updateFloorTexture,
        resetAll,
        isDragging,
        setIsDragging,
        inventory,
        addToInventory,
      }}
    >
      {children}
    </FurnitureContext.Provider>
  );
}

export function useFurnitureStore() {
  const context = useContext(FurnitureContext);
  if (!context) {
    throw new Error('useFurnitureStore must be used within a FurnitureProvider');
  }
  return context;
}
