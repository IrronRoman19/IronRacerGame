export type GameState = 'start' | 'playing' | 'gameover';

export interface GameStore {
  gameState: GameState;
  score: number;
  highScore: number;
  speed: number;
  health: number;
  maxHealth: number;
  invulnerableEndTime: number;
  
  startGame: () => void;
  endGame: () => void;
  setScore: (score: number) => void;
  setSpeed: (speed: number) => void;
  damage: (amount: number) => void;
  reset: () => void;
  
  // Bonus Actions
  repair: (amount: number) => void;
  activateInvulnerability: (duration: number) => void;
}

export const CONTROLS = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  brake: 'brake',
  reset: 'reset',
};