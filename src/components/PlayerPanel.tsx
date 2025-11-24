import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Player {
    id: string;
    name: string;
    points: number;
    trend: 'up' | 'down' | 'stable';
    image: string;
}

const players: Player[] = [
    { id: '1', name: 'J. Jefferson', points: 24.5, trend: 'up', image: 'https://picsum.photos/40/40?random=1' },
    { id: '2', name: 'C. McCaffrey', points: 22.1, trend: 'up', image: 'https://picsum.photos/40/40?random=2' },
    { id: '3', name: 'T. Hill', points: 19.8, trend: 'down', image: 'https://picsum.photos/40/40?random=3' },
    { id: '4', name: 'C. Lamb', points: 18.5, trend: 'stable', image: 'https://picsum.photos/40/40?random=4' },
];

const PlayerPanel: React.FC = () => {
    return (
        <div className="hidden lg:flex flex-col w-64 h-[400px] bg-cyber-panel/80 backdrop-blur-md border border-green-500/30 rounded-lg relative overflow-hidden transform hover:scale-105 transition-transform duration-500 animate-float" style={{ animationDelay: '1s' }}>
            {/* Decorative Corners */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>

            <div className="p-4 border-b border-green-500/20">
                <h3 className="text-green-400 font-mono text-sm tracking-widest uppercase">Top Plays</h3>
            </div>

            <div className="flex-1 p-4 space-y-4">
                {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-green-500/50 group-hover:border-green-400 transition-colors">
                                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="text-xs text-white font-bold font-sans tracking-wide group-hover:text-green-400 transition-colors">{player.name}</div>
                                <div className="text-[10px] text-emerald-400/60 font-mono">PROJ: {player.points}</div>
                            </div>
                        </div>
                        <div className="text-green-400">
                            {player.trend === 'up' && <TrendingUp size={14} />}
                            {player.trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
                            {player.trend === 'stable' && <Minus size={14} className="text-gray-400" />}
                        </div>
                    </div>
                ))}
            </div>

            {/* CPU Decoration */}
            <div className="h-24 w-full border-t border-green-500/20 relative overflow-hidden flex items-center justify-center">
                <svg className="w-16 h-16 text-green-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v12M6 12h12" />
                    <circle cx="12" cy="12" r="4" className="animate-pulse" fill="currentColor" fillOpacity="0.2" />
                </svg>
                <div className="absolute bottom-2 right-2 text-[10px] text-green-500/50 font-mono">
                    SYS.OPTIMIZED
                </div>
            </div>
        </div>
    );
};

export default PlayerPanel;
