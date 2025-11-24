import React, { useState } from 'react';
import NetworkBackground from './components/NetworkBackground';
import StatPanel from './components/StatPanel';
import PlayerPanel from './components/PlayerPanel';
import LoginCard from './components/LoginCard';
import AiAnalyst from './components/AiAnalyst';
import { Hexagon } from 'lucide-react';

const App: React.FC = () => {
  const [showAnalyst, setShowAnalyst] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden flex flex-col">
      <NetworkBackground />

      {/* Navbar / Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative">
                <Hexagon className="text-neon-500 fill-neon-900/50" size={40} strokeWidth={1.5} />
                <span className="absolute inset-0 flex items-center justify-center text-neon-400 font-bold text-lg">T</span>
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl font-sans font-bold tracking-wider text-white group-hover:text-neon-400 transition-colors uppercase leading-none">Trade Center</h1>
                <span className="text-xs font-mono text-emerald-500/70 tracking-[0.2em] uppercase">Fantasy</span>
            </div>
        </div>
        <div className="hidden md:flex space-x-6 text-sm font-mono text-emerald-500/60">
            <span className="hover:text-neon-400 cursor-pointer transition-colors">SYSTEM: ONLINE</span>
            <span className="hover:text-neon-400 cursor-pointer transition-colors">SERVER: US-EAST</span>
            <span className="hover:text-neon-400 cursor-pointer transition-colors">VER: 4.2.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-4 md:px-8 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl gap-12 lg:gap-4">
            
            {/* Left Flank */}
            <div className="order-2 lg:order-1 flex justify-center lg:justify-start w-full lg:w-auto">
                <StatPanel />
            </div>

            {/* Center Stage */}
            <div className="order-1 lg:order-2 flex justify-center w-full lg:flex-1">
                <LoginCard onOracleClick={() => setShowAnalyst(true)} />
            </div>

            {/* Right Flank */}
            <div className="order-3 lg:order-3 flex justify-center lg:justify-end w-full lg:w-auto">
                <PlayerPanel />
            </div>

        </div>
      </main>

      {/* Footer lines */}
      <div className="absolute bottom-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-900 to-transparent pointer-events-none"></div>

      {/* Modal for AI */}
      {showAnalyst && <AiAnalyst onClose={() => setShowAnalyst(false)} />}
    </div>
  );
};

export default App;