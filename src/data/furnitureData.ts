'use client';

export type FurnitureType = 'sofa' | 'table' | 'chair' | 'lamp' | 'bookshelf' | 'bed' | 'desk' | 'custom';

export interface FurnitureDefinition {
  id: FurnitureType;
  name: string;
  nameJa: string;
  icon: string;
  defaultColor: string;
  category: 'living' | 'bedroom' | 'office' | 'custom';
}

export interface PlacedFurniture {
  instanceId: string;
  type: FurnitureType;
  position: [number, number, number];
  rotation: number;
  color: string;
  dimensions?: [number, number, number]; // [width, height, depth] for custom furniture
  textures?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
    top?: string;
  };
  textureUrl?: string;
  modelUrl?: string;
}

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  {
    id: 'sofa',
    name: 'Sofa',
    nameJa: 'ソファ',
    icon: '🛋️',
    defaultColor: '#8B4513',
    category: 'living',
  },
  {
    id: 'table',
    name: 'Coffee Table',
    nameJa: 'テーブル',
    icon: '🪑',
    defaultColor: '#DEB887',
    category: 'living',
  },
  {
    id: 'chair',
    name: 'Chair',
    nameJa: '椅子',
    icon: '🪑',
    defaultColor: '#CD853F',
    category: 'living',
  },
  {
    id: 'lamp',
    name: 'Floor Lamp',
    nameJa: 'ランプ',
    icon: '💡',
    defaultColor: '#FFD700',
    category: 'living',
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    nameJa: '本棚',
    icon: '📚',
    defaultColor: '#8B4513',
    category: 'living',
  },
  {
    id: 'bed',
    name: 'Bed',
    nameJa: 'ベッド',
    icon: '🛏️',
    defaultColor: '#F5F5DC',
    category: 'bedroom',
  },
  {
    id: 'desk',
    name: 'Desk',
    nameJa: 'デスク',
    icon: '🖥️',
    defaultColor: '#A0522D',
    category: 'office',
  },
  {
    id: 'custom',
    name: 'Custom Box',
    nameJa: '📏 カスタムサイズ',
    icon: '📦',
    defaultColor: '#A9A9A9',
    category: 'custom',
  },
];

export const getFurnitureDefinition = (type: FurnitureType): FurnitureDefinition | undefined => {
  return FURNITURE_CATALOG.find((f) => f.id === type);
};
