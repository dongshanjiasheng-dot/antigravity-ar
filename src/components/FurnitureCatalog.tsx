'use client';

import { useState } from 'react';
import { FURNITURE_CATALOG, FurnitureType } from '@/data/furnitureData';
import { useFurnitureStore } from '@/hooks/useFurnitureStore';

interface FurnitureCatalogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FurnitureCatalog({ isOpen, onClose }: FurnitureCatalogProps) {
  const { addFurniture } = useFurnitureStore();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [width, setWidth] = useState(100); // cm
  const [height, setHeight] = useState(100); // cm
  const [depth, setDepth] = useState(100); // cm
  const [textures, setTextures] = useState<{front?: string, side?: string, top?: string}>({});

  const handleAddFurniture = (type: FurnitureType) => {
    if (type === 'custom') {
      setShowCustomDialog(true);
      return;
    }
    addFurniture(type);
    onClose();
  };

  const handleAddCustom = () => {
    // Convert cm to meters for internal logic
    // Minimum size check (e.g. 10cm) to prevent issues
    const w = Math.max(0.1, width / 100);
    const h = Math.max(0.1, height / 100);
    const d = Math.max(0.1, depth / 100);
    
    addFurniture('custom', [w, h, d], textures);
    setShowCustomDialog(false);
    setTextures({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Catalog Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-md z-50 shadow-2xl border-l border-purple-500/30 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              🪑 家具カタログ
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            クリックして家具を追加
          </p>
        </div>

        {/* Furniture Grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {FURNITURE_CATALOG.map((furniture) => (
            <button
              key={furniture.id}
              onClick={() => handleAddFurniture(furniture.id)}
              className="group relative p-4 bg-slate-800/80 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              {/* Icon */}
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {furniture.icon}
              </div>
              
              {/* Name */}
              <div className="text-sm font-medium text-white">
                {furniture.nameJa}
              </div>
              <div className="text-xs text-slate-400">
                {furniture.name}
              </div>
              
              {/* Color preview */}
              <div
                className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white/30"
                style={{ backgroundColor: furniture.defaultColor }}
              />
            </button>
          ))}
        </div>

        {/* Tips */}
        <div className="p-4 border-t border-slate-700">
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
            <h3 className="text-sm font-medium text-purple-300 mb-1">💡 ヒント</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• 家具をクリックして選択</li>
              <li>• ドラッグして移動</li>
              <li>• 選択中に Q/E キーで回転</li>
              <li>• 選択中は Delete キーで削除</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Dimension Dialog Overlay */}
      {/* Custom Dimension Dialog Overlay */}
      {showCustomDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCustomDialog(false)} />
          <div className="relative bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📏 カスタム家具作成
            </h3>
            
            <div className="space-y-6">
              {/* Dimensions Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 border-b border-slate-700 pb-1">1. サイズ (Dimensions)</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">幅 (Width)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      min="10"
                      max="1000"
                    />
                    <span className="text-slate-500 text-sm">cm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">高さ (Height)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      min="10"
                      max="1000"
                    />
                    <span className="text-slate-500 text-sm">cm</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">奥行き (Depth)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(Number(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                      min="10"
                      max="1000"
                    />
                    <span className="text-slate-500 text-sm">cm</span>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 border-b border-slate-700 pb-1">2. 写真 (Photos) <span className="text-xs font-normal text-slate-500">- 任意</span></h4>
                
                {/* Helper text */}
                <p className="text-xs text-slate-400 mb-2">
                  家具の写真をアップロードすると、3Dモデルの表面に貼り付けられます。
                </p>

                {/* Photo Inputs */}
                {[
                  { id: 'front', label: '正面 (Front)', icon: '🖼️' },
                  { id: 'top', label: '上面 (Top)', icon: '⬆️' },
                  { id: 'side', label: '側面 (Side)', icon: '➡️' }
                ].map((face) => (
                  <div key={face.id} className="flex items-center gap-3 bg-slate-700/50 p-2 rounded-lg border border-slate-600">
                    <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center overflow-hidden border border-slate-700 relative group cursor-pointer">
                      {textures[face.id as keyof typeof textures] ? (
                        <>
                          <img 
                            src={textures[face.id as keyof typeof textures]} 
                            alt={face.label} 
                            className="w-full h-full object-cover"
                          />
                          <div 
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            onClick={() => {
                              const newTextures = { ...textures };
                              delete newTextures[face.id as keyof typeof textures];
                              setTextures(newTextures);
                            }}
                          >
                            <span className="text-xs text-red-400">✕</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xl">{face.icon}</span>
                      )}
                      
                      {/* Hidden file input logic here... simplified by using button below */}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xs font-medium text-slate-300">{face.label}</div>
                      <label className="text-xs text-purple-300 hover:text-purple-200 cursor-pointer flex items-center gap-1 mt-1">
                        <span>+ アップロード</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setTextures(prev => ({ ...prev, [face.id]: ev.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => setShowCustomDialog(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 transition"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddCustom}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-600/30"
              >
                作成する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
