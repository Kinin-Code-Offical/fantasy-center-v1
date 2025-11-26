import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerData {
    id: string;
    fullName: string;
    projectedPoints: number;
    photoUrl: string | null;
    editorialTeam: string | null;
    primaryPos: string | null;
}

interface PlayerPanelProps {
    players: PlayerData[];
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ players }) => {
    // Fallback if no players provided
    const displayPlayers = players.length > 0 ? players : [];

    return (
        <div className="hidden lg:flex flex-col w-64 h-[400px] bg-cyber-panel/80 backdrop-blur-md border border-green-500/30 rounded-lg relative overflow-hidden transform hover:scale-105 transition-transform duration-500 animate-float" style={{ animationDelay: '1s' }}>
            {/* Decorative Corners */}
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>

            <div className="p-4 border-b border-green-500/20">
                <h3 className="text-green-400 font-mono text-sm tracking-widest uppercase">Top Plays</h3>
            </div>

            <div className="flex-1 p-4 space-y-4">
                {displayPlayers.map((player, index) => {
                    // Simulate trend based on index for visual variety
                    const trend = index % 3 === 0 ? 'up' : index % 3 === 1 ? 'stable' : 'down';

                    return (
                        <div key={player.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-green-500/50 group-hover:border-green-400 transition-colors bg-black">
                                    <img
                                        src={player.photoUrl || "https://s.yimg.com/lq/i/us/sp/v/nfl/players_l/20230913/default_headshot.png"}
                                        alt={player.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="text-xs text-white font-bold font-sans tracking-wide group-hover:text-green-400 transition-colors truncate max-w-[100px]">
                                        {player.fullName}
                                    </div>
                                    <div className="text-[10px] text-emerald-400/60 font-mono">
                                        PROJ: {player.projectedPoints.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-green-400">
                                {trend === 'up' && <TrendingUp size={14} />}
                                {trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
                                {trend === 'stable' && <Minus size={14} className="text-gray-400" />}
                            </div>
                        </div>
                    );
                })}
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
