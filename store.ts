import { create } from 'zustand';
import { GameStore } from './types';

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'start',
  score: 0,
  highScore: 0,
  speed: 0,
  startGame: () => set({ gameState: 'playing', score: 0, speed: 0 }),
  endGame: () => set((state) => ({ 
    gameState: 'gameover', 
    highScore: Math.max(state.score, state.highScore) 
  })),
  setScore: (score) => set({ score }),
  setSpeed: (speed) => set({ speed }),
  reset: () => set({ gameState: 'start', score: 0, speed: 0 }),
}));
