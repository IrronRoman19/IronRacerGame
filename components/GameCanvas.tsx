import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, KeyboardControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, TiltShift2 } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Player } from './Player';
import { Track, InfiniteFloor } from './Track';
import { CONTROLS } from '../types';
import { useGameStore } from '../store';

export const THEMES = [
  { 
    name: 'IRON', 
    colors: { 
      bg: '#d0e6f5', 
      floor: '#78909c', 
      track: '#263238', 
      rails: '#ff6b00',
      light: '#ffffff'
    } 
  },
  { 
    name: 'COPPER', 
    colors: { 
      bg: '#ffccbc', 
      floor: '#4e342e', 
      track: '#3e2723', 
      rails: '#b87333', // Copper
      light: '#ffab91'
    } 
  },
  { 
    name: 'BRONZE', 
    colors: { 
      bg: '#d7ccc8', 
      floor: '#5d4037', 
      track: '#212121', 
      rails: '#cd7f32', // Bronze
      light: '#ffecb3'
    } 
  },
  { 
    name: 'SILVER', 
    colors: { 
      bg: '#eceff1', 
      floor: '#b0bec5', 
      track: '#455a64', 
      rails: '#00bcd4', // Cyan/Silver accent
      light: '#e0f7fa'
    } 
  },
  { 
    name: 'GOLD', 
    colors: { 
      bg: '#fff8e1', 
      floor: '#ffa000', 
      track: '#212121', 
      rails: '#ffd700', // Gold
      light: '#ffecb3'
    } 
  },
];

const Scene = () => {
    const [playerZ, setPlayerZ] = useState(0);
    const score = useGameStore(state => state.score);
    
    // Determine theme based on score (every 1000m)
    // Use Math.max(0, score) to prevent crashes if score is negative (reverse driving)
    const safeScore = Math.max(0, score);
    const themeIndex = Math.floor(safeScore / 1000) % THEMES.length;
    const currentTheme = THEMES[themeIndex];

    return (
        <>
            {/* Bright, warm room lighting - adjust based on theme */}
            <color attach="background" args={[currentTheme.colors.bg]} />
            <ambientLight intensity={0.6} color={currentTheme.colors.light} />
            <directionalLight 
                position={[50, 50, 25]} 
                intensity={2} 
                color={currentTheme.colors.light}
                castShadow 
                shadow-bias={-0.0001}
                shadow-mapSize={[1024, 1024]} 
            />
            
            <Environment preset="sunset" blur={0.5} />

            <Physics gravity={[0, -30, 0]} frictionGravity={[0, 1, 0]}>
                 <Player />
                 <TrackManager theme={currentTheme} /> 
            </Physics>

            {/* Soft shadows to ground objects on the "floor" */}
            <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />

             <EffectComposer enableNormalPass={false}>
                {/* Subtle bloom for plastic highlights */}
                <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} radius={0.5} />
                {/* TiltShift for the miniature/diorama effect */}
                <TiltShift2 blur={0.2} />
            </EffectComposer>
        </>
    );
};

const TrackManager = ({ theme }: { theme: typeof THEMES[0] }) => {
    const { camera } = useThree();
    const [zPos, setZPos] = useState(0);
    const lastUpdate = useRef(0);

    useFrame(() => {
        if (Math.abs(camera.position.z - lastUpdate.current) > 20) {
            lastUpdate.current = camera.position.z;
            setZPos(Math.floor(camera.position.z));
        }
    });

    return (
        <>
            <InfiniteFloor playerZ={zPos} color={theme.colors.floor} />
            <Track playerZ={zPos} theme={theme} />
        </>
    )
}

export const GameCanvas = () => {
  const map = [
    { name: CONTROLS.forward, keys: ['ArrowUp', 'w', 'W'] },
    { name: CONTROLS.backward, keys: ['ArrowDown', 's', 'S'] },
    { name: CONTROLS.left, keys: ['ArrowLeft', 'a', 'A'] },
    { name: CONTROLS.right, keys: ['ArrowRight', 'd', 'D'] },
    { name: CONTROLS.brake, keys: ['Space'] },
    { name: CONTROLS.reset, keys: ['r', 'R'] },
  ];

  return (
    <div className="w-full h-full bg-blue-50">
        <KeyboardControls map={map}>
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 8, 12], fov: 45 }}>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        </KeyboardControls>
    </div>
  );
};