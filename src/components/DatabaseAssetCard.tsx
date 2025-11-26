"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { Lock } from "lucide-react";

interface Props {
    player: any;
}

export default function DatabaseAssetCard({ player }: Props) {
    return (
        <div className="group relative bg-black/20 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-colors duration-300 flex flex-col h-[500px] grayscale hover:grayscale-0">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-5"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff 3px)" }} />

            {/* Header: Status */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-gray-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none">DATABASE ASSET</span>
                        <span className="text-[8px] text-gray-600 font-mono">ID: {player.id.substring(0, 6)}</span>
                    </div>
                </div>

                {/* Est Value Badge */}
                <div className="px-3 py-1 bg-black/50 border border-white/10 rounded-full">
                    <span className="text-xs font-bold text-gray-400 font-mono tracking-wider">
                        EST: {formatCurrency(player.marketValue)}
                    </span>
                </div>
            </div>

            {/* Main Asset Image (Static Style) */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden z-10 mt-8">
                {/* Circle Container */}
                <div className="relative w-40 h-40 rounded-full border-2 border-white/5 flex items-center justify-center group-hover:border-white/20 transition-colors duration-300">

                    {player.photoUrl ? (
                        <div className="w-36 h-36 rounded-full overflow-hidden relative">
                            <img
                                src={player.photoUrl}
                                alt={player.fullName}
                                className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                        </div>
                    ) : (
                        <div className="text-6xl opacity-20 text-white">👤</div>
                    )}
                </div>

                {/* Player Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-20">
                    <h3 className="text-2xl font-black text-gray-500 group-hover:text-gray-300 uppercase italic tracking-tighter transition-colors duration-300">
                        {player.fullName}
                    </h3>
                    <div className="flex items-center justify-center gap-3 mt-1">
                        <span className="text-xs font-bold text-gray-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                            {player.primaryPos}
                        </span>
                        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                            {player.editorialTeam || "FA"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Status Readout */}
            <div className="p-4 bg-black/40 border-t border-white/5 relative overflow-hidden z-10">
                <div className="font-mono text-[10px] text-red-500/50 mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-900 rounded-full" />
                    <span>OFF_MARKET</span>
                </div>
                <p className="text-xs text-gray-600 font-mono line-clamp-2 min-h-[2.5em]">
                    {">"} ASSET IS CURRENTLY LOCKED. NO ACTIVE LISTINGS DETECTED.
                </p>
            </div>

            {/* Action Button */}
            <div className="p-3 bg-black/60 border-t border-white/5 z-10">
                <Link
                    href={`/player/${player.id}`}
                    className="block w-full py-3 border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 text-center"
                >
                    VIEW DOSSIER
                </Link>
            </div>
        </div>
    );
}
