import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

// Constants
const ROAD_WIDTH = 20;

// Materials
const plasticOrange = new THREE.MeshPhysicalMaterial({ 
  color: '#ff6b00', 
  roughness: 0.2, 
  metalness: 0,
  clearcoat: 0.5
});

const plasticBlue = new THREE.MeshStandardMaterial({ color: '#4287f5', roughness: 0.1 });
const plasticYellow = new THREE.MeshStandardMaterial({ color: '#f5d742', roughness: 0.1 });
const plasticRed = new THREE.MeshStandardMaterial({ color: '#f54242', roughness: 0.1 });

// Reusable Geometry
const obstacleGeometry = new THREE.BoxGeometry(2, 2, 2);

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

  const mat = colorIndex % 3 === 0 ? plasticRed : (colorIndex % 3 === 1 ? plasticBlue : plasticYellow);
  
  return (
    <mesh ref={ref} geometry={obstacleGeometry} material={mat} castShadow receiveShadow />
  );
};

export const Track: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  const visibleRange = 250;
  const startIdx = Math.floor(Math.abs(playerZ) / 20);
  const endIdx = startIdx + (visibleRange / 20);

  const getObstacleData = (index: number) => {
      const z = index * 20;
      // Simple deterministic random
      const rand = Math.sin(index * 12.9898) * 43758.5453;
      const x = (rand - Math.floor(rand)) * (ROAD_WIDTH - 4) - (ROAD_WIDTH/2 - 2);
      return { position: [x, 1.5, -z] as [number, number, number], id: index };
  }

  const obstacles = useMemo(() => {
    const items = [];
    for (let i = startIdx; i < endIdx; i++) {
      if (i === 0) continue; 
      items.push(getObstacleData(i));
    }
    return items;
  }, [startIdx, endIdx]);

  return (
    <group>
      {/* The Track Strip */}
      <TrackStrip playerZ={playerZ} />
      
      {/* Obstacles */}
      {obstacles.map(obs => (
        <Obstacle key={obs.id} position={obs.position} colorIndex={obs.id} />
      ))}
    </group>
  );
};

const TrackStrip: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  const [ref] = useBox(() => ({ 
    type: 'Static', 
    args: [ROAD_WIDTH, 1, 1000], 
    position: [0, -0.5, playerZ - 200] 
  }), useRef<THREE.Mesh>(null));
  
  return (
    <group position={[0, -0.5, -5000]}>
        {/* Main Track Surface */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[ROAD_WIDTH, 10000]} />
            <meshPhysicalMaterial 
                color="#222" 
                roughness={0.4}
                metalness={0.1}
                clearcoat={0.3}
            />
        </mesh>
        
        {/* Side Rails (Orange Plastic) */}
        <mesh position={[ROAD_WIDTH/2 + 0.5, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[1, 1, 10000]} />
             <primitive object={plasticOrange} attach="material" />
        </mesh>
        <mesh position={[-ROAD_WIDTH/2 - 0.5, 0.5, 0]} receiveShadow castShadow>
             <boxGeometry args={[1, 1, 10000]} />
             <primitive object={plasticOrange} attach="material" />
        </mesh>

        {/* Lane markers */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[0.5, 10000]} />
             <meshBasicMaterial color="#ffffff" opacity={0.5} transparent />
        </mesh>
    </group>
  );
}

// The World Floor (Room Floor)
export const InfiniteFloor: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = playerZ;
    }
  });

  // Physics plane for world (safety net)
  useBox(() => ({ type: 'Static', args: [1000, 1, 10000], position: [0, -5, 0] }));

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.1, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial 
        color="#e3dac9" // Wood-ish color
        roughness={0.8}
        metalness={0}
      />
    </mesh>
  );
};
