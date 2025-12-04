import React from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UI } from './components/UI';

const App = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <GameCanvas />
      <UI />
    </div>
  );
};

export default App;
