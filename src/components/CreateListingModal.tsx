"use client";

import { useState } from "react";
import { createListing } from "@/lib/actions/market";
import { X, Plus, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Props {
    userPlayers: any[];
    activeListingPlayerIds?: string[];
}

export default function CreateListingModal({ userPlayers, activeListingPlayerIds = [] }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedPlayer = userPlayers.find(p => p.id === selectedPlayerId);

    const handleSubmit = async () => {
        if (!selectedPlayerId) return;
        setIsSubmitting(true);
        try {
            await createListing(selectedPlayerId, notes);
            setIsOpen(false);
            setNotes("");
            setSelectedPlayerId("");
        } catch (error) {
            console.error(error);
            alert("Failed to create listing");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="group relative px-6 py-3 bg-green-600/20 border border-green-500/50 text-green-400 hover:text-white hover:bg-green-500 hover:border-green-400 transition-all duration-300 overflow-hidden"
                style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
            >
                <div className="absolute inset-0 bg-green-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <Plus className="w-4 h-4" />
                    <span>Initiate Listing</span>
                </div>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 md:bg-black/90 md:backdrop-blur-md p-4">
            <div className="w-full max-w-5xl h-[650px] bg-black/80 border border-white/10 flex flex-col md:flex-row overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 h-12 border-b border-white/10 bg-black/50 flex items-center justify-between px-6 z-20">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        INITIATE ASSET TRANSFER
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Left Column: Inventory */}
                <div className="w-full md:w-1/3 border-r border-white/10 flex flex-col bg-black/20 mt-12">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <h3 className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Select Asset
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {userPlayers.map(p => {
                            const isListed = activeListingPlayerIds.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    disabled={isListed}
                                    onClick={() => setSelectedPlayerId(p.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded border transition-all duration-200 text-left group relative overflow-hidden ${isListed
                                        ? "bg-black/40 border-white/5 opacity-50 cursor-not-allowed"
                                        : selectedPlayerId === p.id
                                            ? "bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                                            : "bg-white/5 border-transparent hover:border-white/20 hover:bg-white/10"
                                        }`}
                                >
                                    {isListed && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                            <span className="text-[10px] font-black text-red-500 border border-red-500/50 bg-red-900/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                                LOCKED
                                            </span>
                                        </div>
                                    )}
                                    <div className={`w-10 h-10 rounded bg-gray-800 overflow-hidden border ${selectedPlayerId === p.id ? "border-green-400" : "border-white/10"}`}>
                                        {p.photoUrl ? (
                                            <img src={p.photoUrl} alt={p.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                                        )}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold ${selectedPlayerId === p.id ? "text-green-400" : "text-white group-hover:text-gray-200"}`}>
                                            {p.fullName}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase">
                                            {p.primaryPos} • {formatCurrency(p.marketValue)}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Trading Desk */}
                <div className="flex-1 flex flex-col relative mt-12 bg-[url('/grid.png')] bg-[length:50px_50px]">
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/80 pointer-events-none" />

                    <div className="relative z-10 flex-1 p-8 flex flex-col">
                        {selectedPlayer ? (
                            <div className="flex-1 flex flex-col animate-in fade-in zoom-in duration-300">
                                {/* Top: Hologram & Value */}
                                <div className="flex items-center gap-8 mb-8">
                                    {/* Hologram Circle */}
                                    <div className="relative w-32 h-32 flex-shrink-0">
                                        <div className="absolute inset-0 rounded-full border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse-slow" />
                                        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-20" />
                                        <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                                            {selectedPlayer.photoUrl ? (
                                                <img
                                                    src={selectedPlayer.photoUrl}
                                                    alt={selectedPlayer.fullName}
                                                    className="w-full h-full object-cover sepia hue-rotate-[50deg] contrast-125 opacity-90"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                                            )}
                                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Info & Value */}
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-1">
                                            {selectedPlayer.fullName}
                                        </h2>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-2 py-0.5 bg-green-900/30 border border-green-500/30 text-green-400 text-xs font-bold rounded">
                                                {selectedPlayer.primaryPos}
                                            </span>
                                            <span className="text-gray-500 font-mono text-xs uppercase">
                                                {selectedPlayer.editorialTeam}
                                            </span>
                                        </div>
                                        <div className="text-4xl font-mono font-bold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                                            {formatCurrency(selectedPlayer.marketValue)}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">
                                            Estimated Market Value
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Trade Notes Input */}
                                <div className="flex-1 mb-8">
                                    <label className="block text-xs font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1 h-1 bg-green-500 rounded-full" />
                                        Trade Notes / Request
                                    </label>
                                    <div className="relative h-full max-h-[200px]">
                                        <textarea
                                            className="w-full h-full bg-black border border-green-500/30 rounded p-4 text-white text-sm focus:border-green-500 focus:shadow-[0_0_20px_rgba(34,197,94,0.2)] outline-none font-mono placeholder:text-gray-700 resize-none transition-all"
                                            placeholder="> ENTER TRADE REQUIREMENTS OR SPECIFIC ASSET REQUESTS..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-gray-600 font-mono">
                                            {notes.length} CHARS
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Confirm Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] clip-path-button relative overflow-hidden group"
                                    style={{ clipPath: "polygon(2% 0, 100% 0, 100% 70%, 98% 100%, 0 100%, 0 30%)" }}
                                >
                                    <span className="relative z-10 group-hover:animate-pulse">
                                        {isSubmitting ? "PROCESSING TRANSFER..." : "CONFIRM LISTING"}
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                                <div className="text-6xl mb-4 animate-pulse">⚡</div>
                                <p className="text-sm font-mono uppercase tracking-widest">Select an asset to initiate transfer</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}