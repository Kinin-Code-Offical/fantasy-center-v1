import React from 'react';

interface MarketListingCardProps {
    player: {
        fullName: string;
        editorialTeam: string | null;
        primaryPos: string | null;
        photoUrl: string | null;
        game: {
            code: string;
        }
    };
    initiator: {
        username: string | null;
        reputation: number;
        avatarUrl: string | null;
    };
    lookingFor: string;
    createdAt: Date;
}

export default function MarketListingCard({ player, initiator, lookingFor, createdAt }: MarketListingCardProps) {
    return (
        <div className="bg-gray-900/80 border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group flex flex-col">
            {/* Player Header */}
            <div className="relative h-32 bg-gradient-to-b from-gray-800 to-gray-900 p-4 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-cyan-500/30 overflow-hidden shrink-0 relative">
                    <img
                        src={player.photoUrl || "/default-avatar.svg"}
                        alt={player.fullName}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{player.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-mono text-cyan-300">{player.primaryPos}</span>
                        <span>•</span>
                        <span>{player.editorialTeam}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block uppercase tracking-wider">{player.game.code}</span>
                </div>

                {/* Badge */}
                <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">
                        ON BLOCK
                    </span>
                </div>
            </div>

            {/* Trade Details */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Looking For</p>
                    <p className="text-sm text-gray-300 italic">"{lookingFor}"</p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                            {initiator.avatarUrl && <img src={initiator.avatarUrl} className="w-full h-full" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-300">{initiator.username || "Unknown User"}</span>
                            <span className="text-[10px] text-yellow-500">★ {initiator.reputation} Rep</span>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded transition-colors">
                        OFFER TRADE
                    </button>
                </div>
            </div>
        </div>
    );
}
