'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const data = [
    { subject: 'Offense', A: 120, fullMark: 150 },
    { subject: 'Defense', A: 98, fullMark: 150 },
    { subject: 'Speed', A: 86, fullMark: 150 },
    { subject: 'Draft', A: 99, fullMark: 150 },
    { subject: 'Waiver', A: 85, fullMark: 150 },
    { subject: 'Luck', A: 65, fullMark: 150 },
];

const StatPanel: React.FC = () => {
    return (
        <div className="hidden lg:flex flex-col w-64 h-[400px] bg-cyber-dark/80 backdrop-blur-md border border-green-500/30 rounded-lg relative overflow-hidden transform hover:scale-105 transition-transform duration-500 animate-float">
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>

            <div className="p-4 border-b border-green-500/20">
                <h3 className="text-green-400 font-mono text-sm tracking-widest uppercase">Live Stat Feed</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-900/20 pointer-events-none"></div>
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                            <PolarGrid stroke="#1f2937" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4ade80', fontSize: 10, fontFamily: 'monospace' }} />
                            <Radar
                                name="My Team"
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
                    <span>O. RATING</span>
                    <span className="text-green-400">98.4</span>
                </div>
                <div className="flex justify-between">
                    <span>D. RATING</span>
                    <span className="text-green-400">82.1</span>
                </div>
                <div className="flex justify-between">
                    <span>PROJ. RANK</span>
                    <span className="text-green-400">#2</span>
                </div>
            </div>
        </div>
    );
};

export default StatPanel;
