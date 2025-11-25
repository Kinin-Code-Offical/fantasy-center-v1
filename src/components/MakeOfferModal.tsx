"use client";

import { useState, useMemo } from "react";
import TradeProposalManager from "./TradeProposalManager";
import { X, TrendingUp, Search, ArrowRight, Wallet, Minus, Lock, AlertTriangle, Terminal } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ToastProvider";

interface Props {
    listing: any;
    userPlayers: any[];
    onClose: () => void;
}

export default function MakeOfferModal({ listing, userPlayers, onClose }: Props) {
    const { showToast } = useToast();
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [credits, setCredits] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter players for selection
    const filteredPlayers = userPlayers.filter(p =>
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Trade Analytics (Profit/Loss Calculation)
    const tradeAnalytics = useMemo(() => {
        const incomingValue = listing.player.marketValue || 0;

        const selectedPlayer = userPlayers.find(p => p.id === selectedPlayerId);
        const outgoingPlayerValue = selectedPlayer?.marketValue || 0;
        const outgoingTotal = outgoingPlayerValue + credits;

        const netValue = incomingValue - outgoingTotal;
        const percentDiff = outgoingTotal > 0 ? (netValue / outgoingTotal) * 100 : 0;

        let status = "FAIR";
        if (percentDiff > 10) status = "WIN";
        if (percentDiff < -10) status = "LOSS";

        return {
            incomingValue,
            outgoingPlayerValue,
            outgoingTotal,
            netValue,
            status
        };
    }, [listing.player.marketValue, selectedPlayerId, credits, userPlayers]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 md:p-4">
            <div className="fixed inset-0 w-full h-full md:relative md:w-4/5 md:max-w-5xl md:h-[650px] bg-black/95 md:bg-black/80 md:border border-white/10 flex flex-col md:grid md:grid-cols-2 overflow-hidden md:rounded-xl shadow-none md:shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                {/* Decorative Corners (Desktop Only) */}
                <div className="hidden md:block absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
                <div className="hidden md:block absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
                <div className="hidden md:block absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
                <div className="hidden md:block absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 h-14 border-b border-white/10 bg-black/50 flex items-center justify-between px-4 md:px-6 z-20 backdrop-blur-sm">
                    <h2 className="text-sm font-black text-neon-cyan uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                        SECURE TRADE TERMINAL
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Left Column: Offer Configuration */}
                <div className="w-full md:w-auto border-r border-white/10 flex flex-col bg-black/20 mt-14 flex-1 overflow-y-auto min-h-0 md:h-full">

                    {/* Target Asset Summary */}
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="text-[10px] font-bold text-neon-green uppercase tracking-widest mb-2 font-mono">
                            // INCOMING ASSET STREAM [RX]
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden border border-neon-green/30 relative group">
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,65,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                                {listing.player.photoUrl ? (
                                    <img src={listing.player.photoUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                ) : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
                            </div>
                            <div>
                                <div className="font-black text-white text-lg uppercase italic tracking-wider">{listing.player.fullName}</div>
                                <div className="text-xs text-neon-green font-mono bg-green-900/20 px-2 py-0.5 rounded inline-block border border-neon-green/20">
                                    VAL: {formatCurrency(listing.player.marketValue)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Player Selection */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-3 border-b border-white/10 bg-black/40 sticky top-0 z-10">
                            <div className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2 font-mono">
                                // OUTGOING ASSET STREAM [TX]
                            </div>
                            <div className="relative">
                                <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="SEARCH DATABASE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-none py-2 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-neon-cyan/50 placeholder:text-gray-700 font-mono uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => setSelectedPlayerId("")}
                                    className={`w-full flex items-center gap-3 p-3 border-l-2 transition-all duration-200 text-left relative overflow-hidden ${selectedPlayerId === ""
                                        ? "bg-neon-cyan/10 border-l-neon-cyan text-white"
                                        : "bg-white/5 border-l-transparent hover:bg-white/10"
                                        }`}
                                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)" }}
                                >
                                    <div className="w-10 h-10 bg-black/40 flex items-center justify-center border border-white/10">
                                        <Minus className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold uppercase font-mono">NO ASSET LINKED</div>
                                        <div className="text-[10px] text-gray-500 font-mono">CASH ONLY TRANSACTION</div>
                                    </div>
                                </button>

                                {filteredPlayers.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlayerId(p.id)}
                                        className={`w-full flex items-center gap-3 p-3 border-l-2 transition-all duration-200 text-left group relative overflow-hidden ${selectedPlayerId === p.id
                                            ? "bg-neon-cyan/20 border-l-neon-cyan text-white shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]"
                                            : "bg-white/5 border-l-transparent hover:border-l-white/20 hover:bg-white/10"
                                            }`}
                                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)" }}
                                    >
                                        <div className="w-10 h-10 bg-black/20 overflow-hidden border border-black/10 relative">
                                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_2px] pointer-events-none z-10 opacity-50" />
                                            {p.photoUrl ? (
                                                <img src={p.photoUrl} alt={p.fullName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold">{p.primaryPos}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate font-mono">{p.fullName}</div>
                                            <div className={`text-[10px] font-mono ${selectedPlayerId === p.id ? "text-neon-cyan" : "text-gray-500"}`}>
                                                VAL: {formatCurrency(p.marketValue)}
                                            </div>
                                        </div>
                                        {selectedPlayerId === p.id && (
                                            <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Credits Input */}
                    <div className="p-4 border-t border-white/10 bg-black/40">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 font-mono">
                            <Wallet className="w-3 h-3" /> Additional Credits
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-green font-mono">$</span>
                            <input
                                type="number"
                                className="w-full bg-black border border-white/20 rounded-none py-2 pl-6 pr-3 text-white text-sm focus:border-neon-green outline-none font-mono"
                                placeholder="0"
                                value={credits}
                                onChange={(e) => setCredits(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Trade Analysis */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-black mt-14 md:mt-14 relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />

                    <div className="max-w-sm mx-auto w-full space-y-8 relative z-10">

                        <div className="text-center space-y-4">
                            <div className="text-xs font-bold text-neon-cyan uppercase tracking-widest font-mono flex items-center justify-center gap-2">
                                <Terminal className="w-4 h-4" />
                                // QUANTUM PROCESSOR [ANALYSIS]
                            </div>

                            <div className="relative py-4">
                                <div className={`text-5xl md:text-6xl font-black tracking-tighter font-mono relative z-10 ${tradeAnalytics.netValue > 0 ? "text-neon-green drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]" : "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                    }`}>
                                    {tradeAnalytics.netValue > 0 ? "+" : ""}{formatCurrency(tradeAnalytics.netValue)}
                                </div>
                                {/* Gauge Background Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-white/5 to-transparent blur-xl -z-10" />
                            </div>

                            <div className="font-mono text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed">
                                <span className="text-neon-cyan">{">"} SYSTEM ANALYSIS:</span> Trade protocol indicates {tradeAnalytics.netValue > 0 ? "significant boost" : "potential deficit"} to roster efficiency vectors.
                            </div>
                        </div>

                        {/* Transaction Log Console */}
                        <div className="bg-black border border-neon-green/30 p-4 font-mono text-xs relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-green/50" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-green" />
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-green" />

                            <div className="space-y-2 opacity-90">
                                <div className="flex justify-between text-gray-400">
                                    <span>[LOG]: TARGET_ASSET_VAL</span>
                                    <span className="text-white">{formatCurrency(listing.player.marketValue)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>[LOG]: OFFER_TOTAL_VAL</span>
                                    <span className="text-white">{formatCurrency(tradeAnalytics.outgoingTotal)}</span>
                                </div>
                                <div className="h-px bg-neon-green/20 my-2" />
                                <div className="flex justify-between font-bold">
                                    <span className="text-neon-cyan">[RES]: NET_IMPACT_CALC</span>
                                    <span className={tradeAnalytics.netValue > 0 ? "text-neon-green" : "text-red-500"}>
                                        {tradeAnalytics.netValue > 0 ? "POSITIVE" : "NEGATIVE"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            // Determine Trade Context
                            let sourceTeamKey = "";
                            let leagueKey = "";
                            let leagueId = "";
                            let targetTeamKey = "";

                            if (selectedPlayerId) {
                                const selectedPlayer = userPlayers.find(p => p.id === selectedPlayerId);
                                if (selectedPlayer) {
                                    sourceTeamKey = selectedPlayer.teamKey;
                                    leagueKey = selectedPlayer.league?.leagueKey;
                                    leagueId = selectedPlayer.league?.id;
                                }
                            } else {
                                // Cash Only: Find common league
                                const sellerTeams = listing.player.teams.filter((t: any) => t.managerId === listing.sellerId);
                                const userLeagueIds = new Set(userPlayers.map(p => p.league.id));
                                const commonTeam = sellerTeams.find((t: any) => userLeagueIds.has(t.league.id));

                                if (commonTeam) {
                                    leagueId = commonTeam.league.id;
                                    leagueKey = commonTeam.league.yahooLeagueKey;
                                    targetTeamKey = commonTeam.yahooTeamKey;

                                    const myPlayerInLeague = userPlayers.find(p => p.league.id === leagueId);
                                    sourceTeamKey = myPlayerInLeague?.teamKey || "";
                                }
                            }

                            if (leagueId && !targetTeamKey) {
                                const sellerTeam = listing.player.teams.find((t: any) => t.managerId === listing.sellerId && t.leagueId === leagueId);
                                targetTeamKey = sellerTeam?.yahooTeamKey || "";
                            }

                            const gameCode = listing.player.gameId.split('.')[0];
                            const canTrade = sourceTeamKey && targetTeamKey && leagueKey && gameCode;

                            return canTrade ? (
                                <TradeProposalManager
                                    leagueKey={leagueKey}
                                    sourceTeamKey={sourceTeamKey}
                                    targetTeamKey={targetTeamKey}
                                    gameCode={gameCode}
                                    offeredPlayerKeys={selectedPlayerId ? [selectedPlayerId] : []}
                                    requestedPlayerKeys={[listing.player.id]}
                                    listingId={listing.id}
                                    offeredCredits={credits}
                                    onSuccess={() => {
                                        showToast("Offer sent successfully", "success");
                                        onClose();
                                    }}
                                />
                            ) : (
                                <div className="text-red-500 text-xs text-center p-2 border border-red-500/20 bg-red-500/10">
                                    UNABLE TO DETERMINE TRADE CONTEXT
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

