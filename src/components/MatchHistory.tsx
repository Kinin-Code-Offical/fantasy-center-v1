import React from 'react';

interface MatchHistoryProps {
    matchups: any[];
    userId: string;
}

export default function MatchHistory({ matchups, userId }: MatchHistoryProps) {
    if (matchups.length === 0) {
        return (
            <div className="text-center py-10 text-green-500/50 font-mono text-sm border border-dashed border-green-500/20 bg-black/40 rounded-lg">
                [SYSTEM]: NO_DATA_FOUND
            </div>
        );
    }

    return (
        <div className="space-y-2 font-mono">
            {matchups.map((match, index) => {
                const isWinnerA = match.winnerTeamId === match.teamAId;
                const isWinnerB = match.winnerTeamId === match.teamBId;

                return (
                    <div key={match.id} className="group relative">
                        {/* Connector Line */}
                        {index !== matchups.length - 1 && (
                            <div className="absolute left-4 top-12 bottom-0 w-px bg-green-500/20 group-hover:bg-green-500/50 transition-colors" />
                        )}

                        <div className="bg-black/40 border-l-2 border-green-500/30 hover:border-green-400 pl-4 py-3 pr-4 flex items-center justify-between transition-all hover:bg-green-500/5">
                            <div className="flex items-center gap-4 flex-1">
                                <span className="text-[10px] text-green-500/50 w-8">0{index + 1}</span>

                                {/* Team A */}
                                <div className={`flex items-center gap-3 ${isWinnerA ? 'text-green-400' : 'text-gray-500'}`}>
                                    <div className="w-6 h-6 rounded bg-gray-900 border border-white/10 overflow-hidden">
                                        {match.teamA.logoUrl && <img src={match.teamA.logoUrl} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="text-sm tracking-tight">{match.teamA.name}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center px-6 border-x border-white/5 mx-4">
                                <span className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">WK {match.week}</span>
                                <div className="text-lg font-bold text-white tracking-widest">
                                    {match.teamAScore} <span className="text-gray-600 mx-1">/</span> {match.teamBScore}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-1 justify-end">
                                {/* Team B */}
                                <div className={`flex items-center gap-3 ${isWinnerB ? 'text-green-400' : 'text-gray-500'}`}>
                                    <span className="text-sm tracking-tight">{match.teamB.name}</span>
                                    <div className="w-6 h-6 rounded bg-gray-900 border border-white/10 overflow-hidden">
                                        {match.teamB.logoUrl && <img src={match.teamB.logoUrl} className="w-full h-full object-cover" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
