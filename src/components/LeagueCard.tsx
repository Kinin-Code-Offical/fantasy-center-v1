import React from 'react';
import Link from 'next/link';

interface LeagueCardProps {
    leagueId: string;
    leagueName: string;
    teamName: string;
    logoUrl?: string | null;
    gameCode: string;
    season: number;
}

export default function LeagueCard({ leagueId, leagueName, teamName, logoUrl, gameCode, season }: LeagueCardProps) {
    return (
        <div className="group relative bg-black/40 border-l-4 border-l-green-500 border-y border-r border-white/10 hover:border-green-500/50 transition-all duration-300 overflow-hidden">
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-900/30 text-green-400 border border-green-500/20">
                            {gameCode} {season}
                        </span>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    </div>
                    {logoUrl && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                            <img src={logoUrl} alt={teamName} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 group-hover:text-green-400 transition-colors">
                    {leagueName}
                </h3>
                <p className="text-sm font-mono text-gray-400 mb-6 flex items-center gap-2">
                    <span className="text-green-500/50">&gt;&gt;</span> {teamName}
                </p>

                {/* Action Button */}
                <Link
                    href={`/league/${leagueId}`}
                    className="block w-full py-3 text-center bg-green-600/20 hover:bg-green-500 text-green-400 hover:text-black font-bold uppercase tracking-widest text-xs border border-green-500/50 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                >
                    Initialize Link
                </Link>
            </div>
        </div>
    );
}
