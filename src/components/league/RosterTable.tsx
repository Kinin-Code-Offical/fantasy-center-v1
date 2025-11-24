import Image from "next/image";
import Link from "next/link";
import { Crosshair } from "lucide-react";

interface Player {
    id: string;
    fullName: string;
    primaryPos: string | null;
    editorialTeam: string | null;
    photoUrl: string | null;
    fantasyPoints: number;
    projectedPoints: number;
    status: string | null;
}

interface RosterTableProps {
    players: Player[];
    leagueId: string;
    isViewingRival?: boolean;
}

export default function RosterTable({ players, leagueId, isViewingRival }: RosterTableProps) {
    if (!players || players.length === 0) {
        return (
            <div className="p-8 border border-red-500/30 rounded-xl bg-red-900/10 text-center">
                <div className="text-red-400 font-mono text-sm uppercase tracking-widest mb-2">System Alert</div>
                <div className="text-white font-bold">NO PLAYERS DETECTED</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {players.map((player) => (
                    <div key={player.id} className="group relative bg-gray-900/80 border border-white/10 rounded-lg p-4 hover:border-green-500 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)] transition-all duration-300 overflow-hidden h-full flex flex-col">
                        <Link href={`/player/${player.id}?leagueId=${leagueId}`} className="absolute inset-0 z-0" />
                        
                        {/* Position Color Indicator Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${player.primaryPos === 'QB' ? 'bg-red-500' :
                            player.primaryPos === 'WR' ? 'bg-blue-500' :
                                player.primaryPos === 'RB' ? 'bg-green-500' :
                                    player.primaryPos === 'TE' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                            }`} />

                        <div className="flex items-center gap-4 pl-2 relative z-10 pointer-events-none">
                            {/* Avatar */}
                            <div className="relative h-14 w-14 shrink-0">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md group-hover:bg-green-500/40 transition-colors" />
                                <div className="relative h-full w-full rounded-full overflow-hidden border-2 border-white/10 group-hover:border-green-500 transition-colors bg-black">
                                    {player.photoUrl ? (
                                        <Image
                                            src={player.photoUrl}
                                            alt={player.fullName}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500 font-mono">
                                            N/A
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${player.primaryPos === 'QB' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            player.primaryPos === 'WR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                player.primaryPos === 'RB' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    player.primaryPos === 'TE' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            {player.primaryPos}
                                        </span>
                                        {/* Status Dot */}
                                        {player.status && (
                                            <span className={`w-2 h-2 rounded-full animate-pulse ${player.status === 'Healthy' || player.status === 'ACT' ? 'bg-green-500' :
                                                player.status === 'Q' || player.status === 'GTD' ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`} title={player.status} />
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-mono text-lg font-bold ${player.fantasyPoints > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                            {player.fantasyPoints?.toFixed(1) || "0.0"}
                                        </span>
                                        <div className="text-[10px] text-gray-500 font-mono">
                                            Proj: {player.projectedPoints?.toFixed(1) || "0.0"}
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-lg truncate group-hover:text-green-400 transition-colors">
                                    {player.fullName}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                                        {player.editorialTeam || "FA"}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-mono">
                                        ID: {player.id.substring(player.id.length - 4)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isViewingRival && (
                            <div className="mt-4 relative z-20">
                                <Link href={`/trades/new?targetPlayerId=${player.id}&leagueId=${leagueId}`} className="w-full flex items-center justify-center gap-2 py-2 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black transition-all font-mono text-xs font-bold uppercase tracking-widest rounded bg-black/50 backdrop-blur-sm">
                                    <Crosshair className="w-4 h-4" />
                                    Acquire Asset
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
