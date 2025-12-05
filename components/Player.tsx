import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';

const CHASSIS_WIDTH = 2;
const CHASSIS_HEIGHT = 0.5;
const CHASSIS_LENGTH = 3.5;

export const Player = () => {
  const { gameState, endGame, setScore, setSpeed } = useGameStore();
  const [sub, get] = useKeyboardControls();
  
  // Physics Body - Arcade style
  // Mass 1 for snappy response.
  const [ref, api] = useBox(() => ({
    mass: 1, 
    args: [CHASSIS_WIDTH, CHASSIS_HEIGHT, CHASSIS_LENGTH],
    position: [0, 2, 0], // Start slightly higher
    angularDamping: 0.95, 
    linearDamping: 0.5, // Higher damping to stop quickly (arcade feel)
    fixedRotation: true, 
    onCollide: (e) => {
        if (gameState === 'playing') {
             // Check impact magnitude
             const impact = e.contact.impactVelocity;
             if (impact > 10) { // Threshold adjusted for lower mass
                endGame();
             }
        }
    }
  }), useRef<THREE.Mesh>(null));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);
  
  const position = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (position.current = p)), [api.position]);

  const state = useThree();
  // Adjust camera offset for a better view
  const cameraOffset = new THREE.Vector3(0, 5, 12); 
  const lookAtOffset = new THREE.Vector3(0, 0, -10);
  const currentLookAt = useRef(new THREE.Vector3(0,0,-10));

  useFrame((ctx, delta) => {
    if (gameState !== 'playing') {
        if(gameState === 'start') {
            // Hover animation in menu
            api.position.set(0, 1 + Math.sin(ctx.clock.elapsedTime * 2) * 0.2, 0);
            api.velocity.set(0,0,0);
            api.rotation.set(0,0,0);
        }
        return;
    }

    const { forward, backward, left, right } = get();
    
    const currentSpeed = -velocity.current[2];
    setSpeed(Math.floor(currentSpeed * 10)); 
    setScore(Math.floor(Math.abs(position.current[2] / 5)));

    const maxSpeed = 100;
    
    // Forces adjusted for Mass: 1
    const accelForce = 60 * delta; // Impulse = Force * dt
    const turnForce = 40 * delta;

    if (forward && currentSpeed < maxSpeed) {
      api.applyLocalImpulse([0, 0, -accelForce], [0, 0, 0]);
    } else if (backward) {
      api.applyLocalImpulse([0, 0, accelForce * 0.5], [0, 0, 0]);
    }

    if (left) {
       api.applyLocalImpulse([-turnForce * (currentSpeed/40 + 1), 0, 0], [0, 0, 0]);
       // Visual Banking
       api.rotation.set(0, 0, THREE.MathUtils.lerp(ref.current!.rotation.z, 0.3, delta * 5));
    } else if (right) {
       api.applyLocalImpulse([turnForce * (currentSpeed/40 + 1), 0, 0], [0, 0, 0]);
       // Visual Banking
        api.rotation.set(0, 0, THREE.MathUtils.lerp(ref.current!.rotation.z, -0.3, delta * 5));
    } else {
        // Level out
        api.rotation.set(0, 0, THREE.MathUtils.lerp(ref.current!.rotation.z, 0, delta * 5));
    }

    // Hover/Suspension Physics
    // Gravity is -30 (set in GameCanvas). Mass is 1. Weight is 30.
    // We need > 30 Upward force to lift.
    const hoverHeight = 1.5;
    if (position.current[1] < hoverHeight) {
        // Spring-like force: stronger the closer we are to ground
        const pushStrength = 1.0 + (hoverHeight - position.current[1]);
        api.applyLocalForce([0, 40 * pushStrength, 0], [0, 0, 0]);
    } else if (position.current[1] > 4) {
        // Push down if too high
        api.applyLocalForce([0, -10, 0], [0, 0, 0]);
    }
    
    // Bounds check
    if (position.current[1] < -5) endGame();
    
    // --- Camera Follow Logic ---
    const carPos = new THREE.Vector3(position.current[0], position.current[1], position.current[2]);
    const targetCamPos = carPos.clone().add(cameraOffset);
    
    // Tighter follow on Z axis to prevent lagging behind at high speeds
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamPos.x, delta * 5);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamPos.y, delta * 5);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamPos.z, delta * 15); // Increased Z lerp speed
    
    const targetLook = carPos.clone().add(lookAtOffset);
    currentLookAt.current.lerp(targetLook, delta * 10);
    state.camera.lookAt(currentLookAt.current);
  });

  return (
    <group ref={ref}>
      <ToyShipModel />
      <SparkParticles />
    </group>
  );
};

const ToyShipModel = () => {
    return (
        <group rotation={[0, Math.PI, 0]}>
             {/* Die-cast Body */}
            <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[1.2, 0.6, 3]} />
                <meshPhysicalMaterial 
                    color="#ffffff" 
                    roughness={0.1} 
                    metalness={0.6} 
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>
            {/* Cockpit Canopy */}
            <mesh position={[0, 0.6, -0.2]}>
                <sphereGeometry args={[0.5, 32, 16]} scale={[1, 0.6, 1.5]} />
                <meshPhysicalMaterial color="#333" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Engines/Wheels substitute */}
            <mesh position={[0.8, 0, 1]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 1]} />
                <meshStandardMaterial color="#ff6b00" />
            </mesh>
            <mesh position={[-0.8, 0, 1]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 1]} />
                <meshStandardMaterial color="#ff6b00" />
            </mesh>
            {/* Rear Spoiler */}
            <mesh position={[0, 0.8, 1.3]}>
                <boxGeometry args={[2, 0.1, 0.5]} />
                <meshStandardMaterial color="#00d2ff" />
            </mesh>
        </group>
    )
}

const SparkParticles = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if(ref.current) {
            ref.current.rotation.z += 0.2;
            ref.current.scale.setScalar(0.5 + Math.random() * 0.2);
        }
    })
    return (
        <mesh ref={ref} position={[0, 0.5, 2.5]} rotation={[Math.PI/2, 0, 0]}>
             <ringGeometry args={[0.3, 0.5, 6]} />
             <meshBasicMaterial color="#00d2ff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
    )
}