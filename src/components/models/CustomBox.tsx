import { useTexture } from '@react-three/drei';
import { PlacedFurniture } from '@/data/furnitureData';

interface CustomBoxProps {
  color?: string;
  textures?: PlacedFurniture['textures'];
  textureUrl?: string;
}

function TexturedFace({ url, index }: { url: string; index: number }) {
  const texture = useTexture(url);
  return <meshStandardMaterial attach={`material-${index}`} map={texture} />;
}

function ColoredFace({ color, index }: { color: string; index: number }) {
  return <meshStandardMaterial attach={`material-${index}`} color={color} transparent opacity={0.8} />;
}

export default function CustomBox({ color = '#A9A9A9', textures, textureUrl }: CustomBoxProps) {
  // Mapping of Three.js material indices to texture keys
  // 0: Right, 1: Left, 2: Top, 3: Bottom, 4: Front, 5: Back
  const faceMapping = [
    { key: 'right', index: 0 },
    { key: 'left', index: 1 },
    { key: 'top', index: 2 },
    { key: 'bottom', index: 3 }, // usually undefined
    { key: 'front', index: 4 },
    { key: 'back', index: 5 }, // usually undefined or same as front/color
  ];

  return (
    <group>
      {/* Main Box */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        {faceMapping.map(({ key, index }) => {
          const url = textureUrl || textures?.[key as keyof typeof textures];
          return url ? (
            <TexturedFace key={key} url={url} index={index} />
          ) : (
            <ColoredFace key={key} color={color} index={index} />
          );
        })}
      </mesh>
      
      {/* Wireframe outline for technical look */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.01, 1.01, 1.01]} />
        <meshBasicMaterial color="white" wireframe />
      </mesh>
    </group>
  );
}
