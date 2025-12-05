import { create } from 'zustand';
import { GameStore } from './types';

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'start',
  score: 0,
  highScore: 0,
  speed: 0,
  health: 100,
  maxHealth: 100,
  invulnerableEndTime: 0,

  startGame: () => set({ 
      gameState: 'playing', 
      score: 0, 
      speed: 0, 
      health: 100, 
      invulnerableEndTime: 0 
  }),
  
  endGame: () => set((state) => ({ 
    gameState: 'gameover', 
    highScore: Math.max(state.score, state.highScore) 
  })),
  
  setScore: (score) => set({ score }),
  setSpeed: (speed) => set({ speed }),
  
  damage: (amount) => set((state) => {
    if (state.gameState !== 'playing') return {};
    
    // Check if invulnerable
    if (Date.now() < state.invulnerableEndTime) {
        return {};
    }
    
    const newHealth = Math.max(0, state.health - amount);
    
    if (newHealth <= 0) {
        return { 
            health: 0, 
            gameState: 'gameover', 
            highScore: Math.max(state.score, state.highScore) 
        };
    }
    
    return { health: newHealth };
  }),

  repair: (amount) => set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount)
  })),

  activateInvulnerability: (duration) => set({
      invulnerableEndTime: Date.now() + duration
  }),

  reset: () => set({ 
      gameState: 'start', 
      score: 0, 
      speed: 0, 
      health: 100, 
      invulnerableEndTime: 0 
  }),
}));