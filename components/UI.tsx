import React from 'react';
import { useGameStore } from '../store';

export const UI = () => {
  const { gameState, score, highScore, speed, startGame, reset } = useGameStore();

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur(); // Remove focus from button so WASD works immediately
    startGame();
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    reset();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10 font-sans">
      
      {/* HUD Top */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col transform skew-x-[-10deg]">
          <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)] stroke-black" style={{WebkitTextStroke: '2px black'}}>
            IRON <span className="text-orange-500">RACER</span>
          </h1>
          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 inline-block transform -skew-x-10 mt-1 shadow-md">
            DIORAMA EDITION
          </div>
        </div>
        
        <div className="text-right bg-white/90 backdrop-blur rounded-xl p-4 shadow-[0_4px_0_rgba(0,0,0,0.1)] border-2 border-slate-200">
             <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distance</div>
             <div className="text-3xl font-black text-slate-800">{score} <span className="text-sm text-slate-400">m</span></div>
             <div className="text-xs text-orange-500 font-bold mt-1">BEST: {highScore}</div>
        </div>
      </div>

      {/* Center Messages */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-white/30 backdrop-blur-sm">
          <div className="text-center bg-white border-4 border-blue-500 p-12 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <h2 className="text-6xl font-black text-slate-800 mb-4 tracking-tight italic">READY?</h2>
            <p className="text-slate-500 mb-8 font-bold text-lg">
              Dodge the blocks. Stay on the track.
            </p>
            <button 
              onClick={handleStart}
              className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-xl shadow-[0_6px_0_#c2410c] hover:shadow-[0_4px_0_#c2410c] active:shadow-none active:translate-y-1 transition-all"
            >
              GO!
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/10 backdrop-blur-md">
          <div className="text-center bg-white border-4 border-red-500 p-12 rounded-3xl shadow-2xl">
            <h2 className="text-6xl font-black text-red-500 mb-2 italic">CRASHED!</h2>
            <div className="text-3xl text-slate-800 font-bold mb-8">SCORE: {score}</div>
            <button 
              onClick={handleReset}
              className="px-10 py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-full text-xl shadow-[0_6px_0_#1e40af] hover:shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-1 transition-all"
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {/* HUD Bottom */}
      <div className="flex justify-between items-end">
         {/* Speedometer */}
         <div className="flex items-end gap-2 bg-slate-900/90 text-white p-4 rounded-xl skew-x-[-10deg] border-b-4 border-orange-500">
            <div className="text-5xl font-mono font-black italic leading-none">
                {Math.abs(speed)}
            </div>
            <div className="text-sm font-bold text-orange-400 mb-1">KM/H</div>
         </div>

         {/* Controls Hint */}
         <div className="hidden md:block text-right opacity-80">
            <div className="flex gap-2 text-slate-800 text-sm font-black">
                <span className="bg-white shadow-[0_2px_0_#cbd5e1] border border-slate-300 px-3 py-2 rounded-lg">W</span>
                <span className="bg-white shadow-[0_2px_0_#cbd5e1] border border-slate-300 px-3 py-2 rounded-lg">A</span>
                <span className="bg-white shadow-[0_2px_0_#cbd5e1] border border-slate-300 px-3 py-2 rounded-lg">S</span>
                <span className="bg-white shadow-[0_2px_0_#cbd5e1] border border-slate-300 px-3 py-2 rounded-lg">D</span>
            </div>
         </div>
      </div>
    </div>
  );
};
