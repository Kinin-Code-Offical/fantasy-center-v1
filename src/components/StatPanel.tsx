'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface PlayerData {
    id: string;
    fullName: string;
    projectedPoints: number;
    stats: any; // Json
}

interface StatPanelProps {
    player?: PlayerData;
}

const StatPanel: React.FC<StatPanelProps> = ({ player }) => {
    // Default data if no player
    const defaultData = [
        { subject: 'PTS', A: 80, fullMark: 100 },
        { subject: 'REB', A: 60, fullMark: 100 },
        { subject: 'AST', A: 70, fullMark: 100 },
        { subject: 'STL', A: 50, fullMark: 100 },
        { subject: 'BLK', A: 40, fullMark: 100 },
        { subject: 'FG%', A: 75, fullMark: 100 },
    ];

    const data = player && player.stats ? [
        { subject: 'PTS', A: Math.min(((player.stats.ppg || 0) / 35) * 100, 100), fullMark: 100 },
        { subject: 'REB', A: Math.min(((player.stats.rpg || 0) / 15) * 100, 100), fullMark: 100 },
        { subject: 'AST', A: Math.min(((player.stats.apg || 0) / 12) * 100, 100), fullMark: 100 },
        { subject: 'STL', A: Math.min(((player.stats.spg || 0) / 3) * 100, 100), fullMark: 100 },
        { subject: 'BLK', A: Math.min(((player.stats.bpg || 0) / 3) * 100, 100), fullMark: 100 },
        { subject: 'FG%', A: (player.stats.fg_pct || 0.45) * 100, fullMark: 100 },
    ] : defaultData;

    const oRating = player ? player.projectedPoints.toFixed(1) : "98.4";
    const dRating = player && player.stats ? ((player.stats.spg || 0) + (player.stats.bpg || 0)).toFixed(1) : "2.1";
    const rank = player ? "#1" : "#2";

    return (
        <div className="hidden lg:flex flex-col w-64 h-[400px] bg-cyber-dark/80 backdrop-blur-md border border-green-500/30 rounded-lg relative overflow-hidden transform hover:scale-105 transition-transform duration-500 animate-float">
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>

            <div className="p-4 border-b border-green-500/20 flex justify-between items-center">
                <h3 className="text-green-400 font-mono text-sm tracking-widest uppercase">Live Stat Feed</h3>
                {player && <span className="text-[10px] text-green-500/70 font-mono">{player.fullName.split(' ').pop()}</span>}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-900/20 pointer-events-none"></div>
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                            <PolarGrid stroke="#1f2937" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4ade80', fontSize: 10, fontFamily: 'monospace' }} />
                            <Radar
                                name="Stats"
                                dataKey="A"
                                stroke="#4ade80"
                                strokeWidth={2}
                                fill="#22c55e"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-4 font-mono text-xs text-emerald-300/70 space-y-2">
                <div className="flex justify-between">
                    <span>PROJ. PTS</span>
                    <span className="text-green-400">{oRating}</span>
                </div>
                <div className="flex justify-between">
                    <span>DEF. IMPACT</span>
                    <span className="text-green-400">{dRating}</span>
                </div>
                <div className="flex justify-between">
                    <span>RANK</span>
                    <span className="text-green-400">{rank}</span>
                </div>
            </div>
        </div>
    );
};

export default StatPanel;
