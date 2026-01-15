'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FurnitureProvider, useFurnitureStore } from '@/hooks/useFurnitureStore';
import { FurnitureType } from '@/data/furnitureData';

// Dynamic imports to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false });
const FurnitureCatalog = dynamic(() => import('@/components/FurnitureCatalog'), { ssr: false });
const ARScene = dynamic(() => import('@/components/ARScene'), { ssr: false });

function HomeContent() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [arSelectedType, setArSelectedType] = useState<FurnitureType | null>(null);
  const [arSelectedModelUrl, setArSelectedModelUrl] = useState<string | null>(null);
  const [arSelectedDimensions, setArSelectedDimensions] = useState<[number, number, number] | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInteriorMenuOpen, setIsInteriorMenuOpen] = useState(false);
  // Refs for file inputs
  const wallInputRef = useRef<HTMLInputElement>(null);
  const floorInputRef = useRef<HTMLInputElement>(null);

  const { 
    furniture, 
    selectedId, 
    placingFurnitureId, 
    roomSettings,
    addFurniture,
    removeFurniture, 
    resetAll, 
    rotateFurniture,
    cancelPlacement,
    updateFurniturePosition,
    confirmPlacement,
    selectFurniture,
    updateWallColor,
    updateFloorColor,
    updateWallTexture,
    updateFloorTexture,
    isDragging,
    setIsDragging,
    inventory,
    addToInventory
  } = useFurnitureStore();

  // Wall and Floor color presets
  const WALL_PRESETS = ['#ffffff', '#f3f4f6', '#fef3c7', '#e0f2fe', '#dcfce7', '#fce7f3'];
  const FLOOR_PRESETS = ['#2b2b2b', '#5D4037', '#8D6E63', '#A1887F', '#E0E0E0', '#B0BEC5'];

  // Handle texture upload
  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'wall' | 'floor') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'wall') {
        updateWallTexture(result);
      } else {
        updateFloorTexture(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  // Get selected furniture for rotation
  const selectedFurniture = furniture.find(f => f.instanceId === selectedId);

  // Rotate selected furniture
  const handleRotate = useCallback((direction: 'left' | 'right') => {
    if (!selectedId || !selectedFurniture) return;
    const rotationStep = Math.PI / 8; // 22.5 degrees
    const newRotation = selectedFurniture.rotation + (direction === 'left' ? rotationStep : -rotationStep);
    rotateFurniture(selectedId, newRotation);
  }, [selectedId, selectedFurniture, rotateFurniture]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cancel placement with Escape
      if (e.key === 'Escape') {
        if (placingFurnitureId) {
          cancelPlacement();
        } else if (isInteriorMenuOpen) {
          setIsInteriorMenuOpen(false);
        } else {
          setIsCatalogOpen(false);
        }
      }
      
      // Delete selected furniture
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !placingFurnitureId) {
          removeFurniture(selectedId);
        }
      }
      
      // Rotation with Q/E or arrow keys (only when not placing)
      if (selectedId && !placingFurnitureId) {
        if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
          handleRotate('left');
        }
        if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') {
          handleRotate('right');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, placingFurnitureId, removeFurniture, handleRotate, cancelPlacement, isInteriorMenuOpen]);

// Helper to convert DataURL to Blob
const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

  // Screenshot functionality
  const handleScreenshot = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `antigravity-room-${Date.now()}.png`;

      // Try Web Share API first (for mobile)
      if (typeof navigator !== 'undefined' && navigator.share) {
        const blob = dataURLtoBlob(dataUrl);
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Antigravity Room Design',
              text: '私がデザインした部屋です！ #AntigravityAR',
              files: [file],
            });
            return; // Share successful
          } catch (shareError) {
            console.log('Share canceled or failed, falling back to download:', shareError);
            // Fallback to download if share fails (except AbortError usually)
          }
        }
      }

      // Fallback: standard download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('画像の保存に失敗しました');
    }
  }, []);

  // Reset confirmation
  const handleReset = useCallback(() => {
    if (furniture.length === 0) return;
    
    if (confirm('すべての家具を削除しますか？')) {
      resetAll();
    }
  }, [furniture.length, resetAll]);

  // Check if we're in placement mode
  const isPlacing = !!placingFurnitureId;

  const [showARHelp, setShowARHelp] = useState(false);

  // ... (inside HomeContent)

  const startAR = () => {
    setShowARHelp(false);
    setIsARMode(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* AR Help Modal */}
      {showARHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">📱 ARモードの使い方</h3>
            <div className="space-y-4 text-slate-300 mb-6">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">1</span>
                <p>「ARを開始」ボタンを押してカメラを起動します。</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">2</span>
                <p>カメラをゆっくり動かして床を認識させます。<br/><span className="text-xs text-slate-400">※緑色のグリッド（網目）が表示されるまで動かしてください</span></p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">3</span>
                <p>配置したい場所にグリッドと家具が表示されたら、画面下の<span className="text-green-400 font-bold">「ここに配置」</span>ボタンを押します。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowARHelp(false)}
                className="flex-1 py-3 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                キャンセル
              </button>
              <button 
                onClick={startAR}
                className="flex-1 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-600/30"
              >
                始める
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 p-4 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Anti</span>gravity AR
              </h1>
              <p className="text-xs text-slate-400">インテリアシミュレーター</p>
            </div>
          </div>
          
          {/* Stats / Placement Mode Indicator */}
          <div className="hidden sm:flex items-center gap-4">
            {isPlacing ? (
              <div className="px-4 py-2 bg-green-600/30 rounded-lg border border-green-500 animate-pulse">
                <span className="text-sm font-medium text-green-300">📍 配置モード - クリックで設置</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">配置済み:</span>
                <span className="ml-2 text-sm font-medium text-white">{furniture.length}</span>
              </div>
            )}
          </div>
          
          {/* Mode buttons */}
          <nav className="flex gap-2">
            <button 
              onClick={() => setIsARMode(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition shadow-lg ${
                !isARMode 
                  ? 'text-white bg-purple-600 shadow-purple-600/20' 
                  : 'text-purple-300 border border-purple-500/50 hover:bg-purple-500/20'
              }`}
            >
              3D ビューア
            </button>
            <button 
              onClick={() => setShowARHelp(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                isARMode 
                  ? 'text-white bg-gradient-to-r from-pink-500 to-orange-500 shadow-lg shadow-pink-500/30' 
                  : 'text-purple-300 border border-purple-500/50 hover:bg-purple-500/20'
              }`}
            >
              📱 AR モード
            </button>
          </nav>
        </div>
      </header>

      {/* Conditionally render 3D or AR scene */}
      {isARMode ? (
        <ARScene
          furniture={furniture}
          selectedType={arSelectedType}
          selectedDimensions={arSelectedDimensions}
          onPlaceFurniture={(position, rotation, textureUrl) => {
            // Add furniture at AR position
            if (arSelectedType) {
              addFurniture(arSelectedType, arSelectedDimensions, undefined, position, textureUrl, arSelectedModelUrl || undefined);
            }
          }}
          onSelectType={(type, modelUrl) => {
            setArSelectedType(type);
            setArSelectedModelUrl(modelUrl || null);
          }}
          onUpdateDimensions={setArSelectedDimensions}
          onExitAR={() => setIsARMode(false)}
          inventory={inventory}
          addToInventory={addToInventory}
        />
      ) : (
        <div className="w-full h-screen pt-16 pb-20">
          <Scene3D 
            ref={canvasRef}
            furniture={furniture}
            placingFurnitureId={placingFurnitureId}
            selectedId={selectedId}
            roomSettings={roomSettings}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            onUpdatePosition={updateFurniturePosition}
            onConfirmPlacement={confirmPlacement}
            onSelectFurniture={selectFurniture}
          />
        </div>
      )}

      {/* Interior Settings Panel */}
      {isInteriorMenuOpen && (
        <div className="fixed bottom-24 right-4 z-20 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">🎨 内装カスタマイズ</h3>
            <button 
              onClick={() => setIsInteriorMenuOpen(false)}
              className="text-slate-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Wall Settings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  壁のデザイン
                </label>
                <button
                  onClick={() => wallInputRef.current?.click()}
                  className="text-xs text-purple-300 hover:text-purple-200 hover:underline"
                >
                  🖼️ 画像をアップロード
                </button>
                <input
                  ref={wallInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleTextureUpload(e, 'wall')}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap mb-2">
                {WALL_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateWallColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      roomSettings.wallColor === color && !roomSettings.wallTexture ? 'border-purple-500 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              {!roomSettings.wallTexture && (
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={roomSettings.wallColor}
                    onChange={(e) => updateWallColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              )}

              {roomSettings.wallTexture && (
                <div className="mt-2 p-2 bg-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-400">画像適用中</span>
                  <button 
                    onClick={() => updateWallColor('#ffffff')}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    解除
                  </button>
                </div>
              )}
            </div>

            {/* Floor Settings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  床のデザイン
                </label>
                <button
                  onClick={() => floorInputRef.current?.click()}
                  className="text-xs text-purple-300 hover:text-purple-200 hover:underline"
                >
                  🖼️ 画像をアップロード
                </button>
                <input
                  ref={floorInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleTextureUpload(e, 'floor')}
                />
              </div>

              <div className="flex gap-2 flex-wrap mb-2">
                {FLOOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateFloorColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      roomSettings.floorColor === color && !roomSettings.floorTexture ? 'border-purple-500 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              {!roomSettings.floorTexture && (
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={roomSettings.floorColor}
                    onChange={(e) => updateFloorColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              )}

              {roomSettings.floorTexture && (
                <div className="mt-2 p-2 bg-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-400">画像適用中</span>
                  <button 
                    onClick={() => updateFloorColor('#2b2b2b')}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    解除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          {/* Placement mode controls */}
          {isPlacing ? (
            <>
              <div className="px-6 py-3 text-sm font-medium text-green-300 bg-green-600/20 rounded-xl border border-green-500/50">
                🎯 位置を調整してください
              </div>
              <button
                onClick={confirmPlacement}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transition shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95"
              >
                ✓ 配置完了
              </button>
              <button
                onClick={cancelPlacement}
                className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition hover:scale-105 active:scale-95"
              >
                ✕ キャンセル
              </button>
            </>
          ) : (
            <>
              {/* Normal mode controls */}
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 active:scale-95"
              >
                🪑 家具を追加
              </button>

              <button
                onClick={() => setIsInteriorMenuOpen(!isInteriorMenuOpen)}
                className={`px-6 py-3 text-sm font-medium text-white rounded-xl transition hover:scale-105 active:scale-95 ${
                  isInteriorMenuOpen ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                🎨 内装
              </button>
              
              <button
                onClick={handleReset}
                disabled={furniture.length === 0}
                className="px-6 py-3 text-sm font-medium text-white bg-slate-700 rounded-xl hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                🔄 リセット
              </button>
              
              <button
                onClick={handleScreenshot}
                className="px-6 py-3 text-sm font-medium text-white bg-slate-700 rounded-xl hover:bg-slate-600 transition hover:scale-105 active:scale-95"
              >
                📷 共有・保存
              </button>
              
              {/* Rotation controls - only show when furniture is selected */}
              {selectedId && (
                <>
                  <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => handleRotate('left')}
                      className="px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 rounded-lg transition"
                      title="左に回転 (Q)"
                    >
                      ↺
                    </button>
                    <span className="px-2 text-xs text-slate-400">回転</span>
                    <button
                      onClick={() => handleRotate('right')}
                      className="px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 rounded-lg transition"
                      title="右に回転 (E)"
                    >
                      ↻
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeFurniture(selectedId)}
                    className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition hover:scale-105 active:scale-95"
                  >
                    🗑️ 削除
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Furniture Catalog */}
      <FurnitureCatalog
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />

      {/* Help tooltip */}
      <div className="fixed bottom-24 left-4 text-xs text-slate-500 hidden sm:block">
        {isPlacing ? (
          <p>クリック: 設置 | Escape: キャンセル</p>
        ) : (
          <p>マウスドラッグ: カメラ回転 | スクロール: ズーム | Q/E: 家具回転</p>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <FurnitureProvider>
      <HomeContent />
    </FurnitureProvider>
  );
}
