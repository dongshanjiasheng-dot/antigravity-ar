'use client';

import { useRef, useMemo } from 'react';
import { Group } from 'three';

interface BookshelfProps {
  color?: string;
}

// Deterministic pseudo-random function based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export default function Bookshelf({ color = '#8B4513' }: BookshelfProps) {
  const groupRef = useRef<Group>(null);

  const shelfColors = ['#8B0000', '#006400', '#00008B', '#4B0082', '#8B4513'];

  // Generate deterministic book data using useMemo
  const booksData = useMemo(() => {
    const shelves = [0.25, 0.7, 1.15, 1.58];
    return shelves.map((shelfY, shelfIndex) => {
      const bookCount = 5 + (shelfIndex % 3); // Deterministic count based on shelf index
      const books = Array.from({ length: bookCount }).map((_, bookIndex) => {
        const seed = shelfIndex * 100 + bookIndex;
        const bookWidth = 0.04 + seededRandom(seed) * 0.03;
        const bookHeight = 0.2 + seededRandom(seed + 50) * 0.15;
        const xOffset = -0.28 + bookIndex * 0.09;
        return { bookWidth, bookHeight, xOffset, seed };
      });
      return { shelfY, shelfIndex, books };
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Back panel */}
      <mesh position={[0, 0.9, -0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.8, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Left side */}
      <mesh position={[-0.38, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.8, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Right side */}
      <mesh position={[0.38, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 1.8, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Shelves */}
      {[0.02, 0.45, 0.9, 1.35, 1.78].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.04, 0.3]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      
      {/* Books on shelves */}
      {booksData.map(({ shelfY, shelfIndex, books }) => (
        <group key={shelfIndex}>
          {books.map(({ bookWidth, bookHeight, xOffset }, bookIndex) => (
            <mesh 
              key={bookIndex} 
              position={[xOffset, shelfY + bookHeight / 2, 0.02]}
              castShadow
            >
              <boxGeometry args={[bookWidth, bookHeight, 0.18]} />
              <meshStandardMaterial 
                color={shelfColors[(shelfIndex + bookIndex) % shelfColors.length]} 
                roughness={0.9} 
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
