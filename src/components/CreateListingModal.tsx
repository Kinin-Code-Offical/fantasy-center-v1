"use client";

import { useState, useEffect } from "react";
import { createListing } from "@/lib/actions/market";
import { X, Plus, Zap, Search } from "lucide-react";
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

    // New State for Redesign
    const [activeLeagueId, setActiveLeagueId] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    // Extract unique leagues
    const leagues = Array.from(new Map(userPlayers.map(p => [p.league?.id, p.league])).values()).filter(l => l?.id);

    // Set default league when modal opens or leagues change
    useEffect(() => {
        if (isOpen && leagues.length > 0 && !activeLeagueId) {
            setActiveLeagueId(leagues[0].id);
        }
    }, [isOpen, leagues, activeLeagueId]);

    // Filter players
    const filteredPlayers = userPlayers.filter(p => {
        const matchesLeague = activeLeagueId ? p.league?.id === activeLeagueId : true;
        const matchesSearch = p.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLeague && matchesSearch;
    });

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 md:p-4">
            <div className="fixed inset-0 w-full h-full md:relative md:w-4/5 md:max-w-5xl md:h-[650px] bg-black/95 md:bg-black/80 md:border border-white/10 flex flex-col md:grid md:grid-cols-2 overflow-hidden md:rounded-xl shadow-none md:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
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
                <div className="w-full md:w-auto border-r border-white/10 flex flex-col bg-black/20 mt-12 flex-1 overflow-y-auto min-h-0 md:h-full">
                    {/* League Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto p-3 border-b border-white/10 cyber-scrollbar-x bg-black/40 snap-x snap-mandatory">
                        {leagues.map((league: any) => (
                            <button
                                key={league.id}
                                onClick={() => setActiveLeagueId(league.id)}
                                className={`snap-start px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap rounded transition-all ${activeLeagueId === league.id
                                        ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                        : "border border-green-500/30 text-gray-400 hover:text-white hover:border-green-500/60"
                                    }`}
                            >
                                {league.name}
                            </button>
                        ))}
                    </div>

                    {/* Quick Filter */}
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Filter inventory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-green-500/50 placeholder:text-gray-600 font-mono"
                            />
                        </div>
                    </div>

                    {/* Player Grid */}
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                            {filteredPlayers.map((p: any) => {
                                const isListed = activeListingPlayerIds.includes(p.id);
                                const uniqueKey = `${p.id}-${p.league?.id}`;
                                const isSelected = selectedPlayerId === p.id;

                                return (
                                    <button
                                        key={uniqueKey}
                                        disabled={isListed}
                                        onClick={() => setSelectedPlayerId(p.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded border transition-all duration-200 text-left group relative overflow-hidden ${isListed
                                            ? "bg-black/40 border-white/5 opacity-50 cursor-not-allowed"
                                            : isSelected
                                                ? "bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                                : "bg-white/5 border-transparent hover:border-white/20 hover:bg-white/10"
                                            }`}
                                    >
                                        {isListed && (
                                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
                                                <span className="text-[10px] font-black text-red-500 border border-red-500/50 bg-red-900/20 px-2 py-0.5 rounded uppercase tracking-widest">
                                                    LOCKED
                                                </span>
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-12 h-12 rounded bg-black/20 border ${isSelected ? "border-black/20" : "border-white/10"} flex items-center justify-center overflow-hidden`}>
                                                <img
                                                    src={p.photoUrl || "/default-avatar.svg"}
                                                    alt={p.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-xs font-bold truncate ${isSelected ? "text-black" : "text-white group-hover:text-green-400"} transition-colors`}>
                                                {p.fullName}
                                            </div>
                                            <div className={`flex items-center gap-2 text-[10px] font-mono mt-0.5 ${isSelected ? "text-black/70" : "text-gray-500"}`}>
                                                <span className={isSelected ? "font-bold" : "text-green-500/80"}>{p.primaryPos}</span>
                                                <span>•</span>
                                                <span>{p.nflTeam || "FA"}</span>
                                            </div>
                                            <div className={`text-[10px] font-mono mt-1 ${isSelected ? "text-black/60" : "text-gray-600"}`}>
                                                {formatCurrency(p.marketValue)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredPlayers.length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-xs font-mono">
                                    NO ASSETS FOUND
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Trading Desk */}
                <div className={`flex-shrink-0 md:flex-1 flex flex-col relative md:mt-12 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] ${selectedPlayer ? 'h-auto min-h-[50%] md:h-auto' : 'h-0 md:h-auto overflow-hidden'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/80 pointer-events-none" />

                    <div className="relative z-10 flex-1 p-4 pb-24 md:p-8 flex flex-col overflow-y-auto md:overflow-visible">
                        {selectedPlayer ? (
                            <div className="flex-1 flex flex-col animate-in fade-in zoom-in duration-300">
                                {/* Top: Hologram & Value */}
                                <div className="flex items-center gap-8 mb-8">
                                    {/* Hologram Circle */}
                                    <div className="relative w-32 h-32 flex-shrink-0">
                                        <div className="absolute inset-0 rounded-full border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse-slow" />
                                        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-20" />
                                        <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                                            <img
                                                src={selectedPlayer.photoUrl || "/default-avatar.svg"}
                                                alt={selectedPlayer.fullName}
                                                className="w-full h-full object-cover sepia hue-rotate-[50deg] contrast-125 opacity-90"
                                            />
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