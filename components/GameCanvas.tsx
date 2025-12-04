import React, { Suspense, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, KeyboardControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, TiltShift2 } from '@react-three/postprocessing';
import { Player } from './Player';
import { Track, InfiniteFloor } from './Track';
import { CONTROLS } from '../types';

const Scene = () => {
    const [playerZ, setPlayerZ] = useState(0);

    return (
        <>
            {/* Bright, warm room lighting */}
            <color attach="background" args={['#d0e6f5']} />
            <ambientLight intensity={0.8} />
            <directionalLight 
                position={[50, 50, 25]} 
                intensity={2} 
                castShadow 
                shadow-bias={-0.0001}
                shadow-mapSize={[1024, 1024]} 
            />
            
            <Environment preset="sunset" blur={0.5} />

            <Physics gravity={[0, -30, 0]} frictionGravity={[0, 1, 0]}>
                 <Player />
                 <TrackManager /> 
            </Physics>

            {/* Soft shadows to ground objects on the "floor" */}
            <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />

             <EffectComposer disableNormalPass>
                {/* Subtle bloom for plastic highlights */}
                <Bloom luminanceThreshold={1} mipmapBlur intensity={0.5} radius={0.5} />
                {/* TiltShift for the miniature/diorama effect */}
                <TiltShift2 blur={0.2} />
            </EffectComposer>
        </>
    );
};

const TrackManager = () => {
    const { camera } = useThree();
    const [zPos, setZPos] = useState(0);
    const lastUpdate = React.useRef(0);

    useFrame(() => {
        if (Math.abs(camera.position.z - lastUpdate.current) > 20) {
            lastUpdate.current = camera.position.z;
            setZPos(Math.floor(camera.position.z));
        }
    });

    return (
        <>
            <InfiniteFloor playerZ={zPos} />
            <Track playerZ={zPos} />
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
