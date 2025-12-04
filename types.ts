export type GameState = 'start' | 'playing' | 'gameover';

export interface GameStore {
  gameState: GameState;
  score: number;
  highScore: number;
  speed: number;
  startGame: () => void;
  endGame: () => void;
  setScore: (score: number) => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
}

export const CONTROLS = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  brake: 'brake',
  reset: 'reset',
};
