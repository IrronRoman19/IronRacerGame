import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useGameStore } from '../store';

// Constants
const ROAD_WIDTH = 20;

// Reusable Geometry
const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);

// Types
type ItemType = 'obstacle' | 'repair' | 'invulnerable';

interface TrackItemData {
  position: [number, number, number];
  id: number;
  type: ItemType;
}

interface ObstacleProps {
  position: [number, number, number];
  colorIndex: number;
}

const Obstacle: React.FC<ObstacleProps> = ({ position, colorIndex }) => {
  const [ref] = useBox(() => ({ 
    mass: 5, 
    type: 'Kinematic', 
    position,
    args: [2, 2, 2],
    collisionFilterGroup: 2, 
  }), useRef<THREE.Mesh>(null));

  // Determine color based on index
  const color = colorIndex % 3 === 0 ? '#f54242' : (colorIndex % 3 === 1 ? '#4287f5' : '#f5d742');
  
  return (
    <mesh ref={ref} geometry={obstacleGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.1} />
    </mesh>
  );
};

interface BonusProps {
    position: [number, number, number];
    type: 'repair' | 'invulnerable';
}

const Bonus: React.FC<BonusProps> = ({ position, type }) => {
    const [visible, setVisible] = useState(true);
    const { repair, activateInvulnerability } = useGameStore();

    const [ref] = useBox(() => ({
        isTrigger: true, // Sensor only, no physical collision
        args: [2, 2, 2],
        position: [position[0], position[1] + 1, position[2]],
        onCollide: () => {
            if (visible) {
                setVisible(false);
                if (type === 'repair') {
                    repair(50); // Repair 50%
                } else if (type === 'invulnerable') {
                    activateInvulnerability(45000); // 45 seconds
                }
            }
        }
    }), useRef<THREE.Group>(null));

    useFrame((state) => {
        if (ref.current && visible) {
            ref.current.rotation.y += 0.05;
            ref.current.position.y = (position[1] + 1) + Math.sin(state.clock.elapsedTime * 3) * 0.5;
        }
    });

    if (!visible) return null;

    return (
        <group ref={ref}>
            {type === 'repair' && (
                <group>
                    <mesh rotation={[0,0,0]}>
                        <boxGeometry args={[0.5, 1.5, 0.5]} />
                        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
                    </mesh>
                    <mesh rotation={[0,0,Math.PI/2]}>
                        <boxGeometry args={[0.5, 1.5, 0.5]} />
                        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
                    </mesh>
                    <pointLight distance={3} intensity={2} color="#22c55e" />
                </group>
            )}
            {type === 'invulnerable' && (
                <group>
                    <mesh>
                        <icosahedronGeometry args={[0.8, 0]} />
                        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} wireframe />
                    </mesh>
                    <pointLight distance={3} intensity={2} color="#3b82f6" />
                </group>
            )}
        </group>
    );
}

interface ThemeColors {
    floor: string;
    track: string;
    rails: string;
    light: string;
    bg: string;
}

interface Theme {
    name: string;
    colors: ThemeColors;
}

export const Track: React.FC<{ playerZ: number, theme: Theme }> = ({ playerZ, theme }) => {
  const visibleRange = 250;
  const startIdx = Math.floor(Math.abs(playerZ) / 20);
  const endIdx = startIdx + (visibleRange / 20);

  const getItemData = (index: number): TrackItemData => {
      const z = index * 20;
      // Simple deterministic random
      const rand = Math.sin(index * 12.9898) * 43758.5453;
      const normalizedRand = rand - Math.floor(rand);
      
      const x = (normalizedRand) * (ROAD_WIDTH - 4) - (ROAD_WIDTH/2 - 2);
      
      let type: ItemType = 'obstacle';

      if (index > 10) {
          // Invulnerable Logic: Range 750m-2000m (indices ~188-500)
          // Stride 350 (1400m), Offset 0-100 (400m).
          // Resulting Distance Range: Min ~1000m, Max ~1800m. (Satisfies 750-2000m range)
          const invulnStride = 350;
          const invulnBlock = Math.floor(index / invulnStride);
          const invulnRand = Math.abs(Math.sin(invulnBlock * 123.45) * 43758.5453) % 1;
          const invulnOffset = Math.floor(invulnRand * 100);
          const isInvuln = (index % invulnStride) === invulnOffset;

          // Repair Logic: Range 250m-500m (indices ~63-125)
          // Stride 90 (360m), Offset 0-25 (100m).
          // Resulting Distance Range: Min ~260m, Max ~460m. (Satisfies 250-500m range)
          const repairStride = 90;
          const repairBlock = Math.floor(index / repairStride);
          const repairRand = Math.abs(Math.sin(repairBlock * 678.90) * 43758.5453) % 1;
          const repairOffset = Math.floor(repairRand * 25);
          const isRepair = (index % repairStride) === repairOffset;

          if (isInvuln) {
              type = 'invulnerable';
          } else if (isRepair) {
              type = 'repair';
          } else {
             // Obstacle Density
             type = 'obstacle';
          }
      }

      return { position: [x, 1.5, -z] as [number, number, number], id: index, type };
  }

  const items = useMemo(() => {
    const list = [];
    for (let i = startIdx; i < endIdx; i++) {
      if (i === 0) continue; 
      list.push(getItemData(i));
    }
    return list;
  }, [startIdx, endIdx]);

  return (
    <group>
      {/* The Track Strip */}
      <TrackStrip theme={theme} playerZ={playerZ} />
      
      {/* Items */}
      {items.map(item => {
          if (item.type === 'obstacle') {
              return <Obstacle key={item.id} position={item.position} colorIndex={item.id} />;
          } else {
              return <Bonus key={item.id} position={item.position} type={item.type as 'repair' | 'invulnerable'} />;
          }
      })}
    </group>
  );
};

const TrackStrip: React.FC<{ theme: Theme, playerZ: number }> = ({ theme, playerZ }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Main Floor Physics (Static, Infinite)
  // Use a huge box centered at 0 to cover effectively infinite distance
  useBox(() => ({ 
    type: 'Static', 
    args: [ROAD_WIDTH, 1, 1000000], 
    position: [0, -0.5, 0] 
  }));
  
  // Left Border Physics (Invisible Wall)
  useBox(() => ({
    type: 'Static',
    args: [1, 5, 1000000], // Height 5 to contain the car
    position: [ROAD_WIDTH / 2 + 0.5, 2, 0]
  }));

  // Right Border Physics (Invisible Wall)
  useBox(() => ({
    type: 'Static',
    args: [1, 5, 1000000],
    position: [-(ROAD_WIDTH / 2 + 0.5), 2, 0]
  }));

  // Update visual position to follow player
  useFrame(() => {
    if (meshRef.current) {
        meshRef.current.position.z = playerZ;
    }
  });
  
  return (
    <group ref={meshRef} position={[0, -0.5, 0]}>
        {/* Main Track Surface - Visual Plane */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            {/* Render a large enough plane to cover visibility, it will move with player */}
            <planeGeometry args={[ROAD_WIDTH, 1000]} />
            <meshPhysicalMaterial 
                color={theme.colors.track} 
                roughness={0.4}
                metalness={0.1}
                clearcoat={0.3}
            />
        </mesh>
        
        {/* Side Rails (Visual only) */}
        <mesh position={[ROAD_WIDTH/2 + 0.5, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[1, 1, 1000]} />
             <meshPhysicalMaterial 
                color={theme.colors.rails} 
                roughness={0.2} 
                metalness={0.6}
             />
        </mesh>
        <mesh position={[-ROAD_WIDTH/2 - 0.5, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[1, 1, 1000]} />
             <meshPhysicalMaterial 
                color={theme.colors.rails} 
                roughness={0.2} 
                metalness={0.6}
             />
        </mesh>

        {/* Lane markers */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.5, 1000]} />
             <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
        </mesh>
    </group>
  );
}

// The World Floor (Room Floor)
export const InfiniteFloor: React.FC<{ playerZ: number, color: string }> = ({ playerZ, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = playerZ;
    }
  });

  // Physics plane for world (safety net)
  useBox(() => ({ type: 'Static', args: [1000, 1, 1000000], position: [0, -5, 0] }));

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.1, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};