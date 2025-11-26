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
    activeTrades?: any[];
}

export default function MakeOfferModal({ listing, userPlayers, onClose, activeTrades = [] }: Props) {
    const { showToast } = useToast();
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [credits, setCredits] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Deduplicate userPlayers to prevent key collisions
    const uniqueUserPlayers = useMemo(() => {
        const seen = new Set();
        return userPlayers.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });
    }, [userPlayers]);

    // Identify locked players (involved in active trades)
    const lockedPlayerIds = useMemo(() => {
        const ids = new Set<string>();
        activeTrades.forEach(trade => {
            trade.items?.forEach((item: any) => {
                ids.add(item.playerKey);
            });
        });
        return ids;
    }, [activeTrades]);

    // Filter players for selection
    const filteredPlayers = uniqueUserPlayers.filter(p =>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 md:p-4 backdrop-blur-sm">
            <div className="fixed inset-0 w-full h-full md:relative md:w-4/5 md:max-w-5xl md:h-[650px] bg-[#050a05] md:border border-neon-green/30 flex flex-col md:grid md:grid-cols-2 overflow-hidden md:rounded-xl shadow-[0_0_50px_rgba(0,255,65,0.1)] relative group">

                {/* Cyber Glitch Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/grid.svg')] z-0" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50" />

                {/* Decorative Corners (Desktop Only) */}
                <div className="hidden md:block absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-green z-20" />
                <div className="hidden md:block absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-green z-20" />
                <div className="hidden md:block absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-green z-20" />
                <div className="hidden md:block absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-green z-20" />

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 h-16 border-b border-neon-green/20 bg-black/80 flex items-center justify-between px-4 md:px-6 z-30 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-neon-green rotate-45 shadow-[0_0_10px_#00ff41]" />
                        <h2 className="text-lg font-black text-white uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                            SECURE TRADE TERMINAL
                            <span className="text-neon-green text-xs animate-pulse">_v2.0</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-neon-red transition-colors p-2 hover:bg-neon-red/10 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Left Column: Offer Configuration */}
                <div className="w-full md:w-auto border-r border-neon-green/20 flex flex-col bg-black/40 mt-16 flex-1 overflow-y-auto min-h-0 md:h-full relative z-10 custom-scrollbar">

                    {/* Target Asset Summary */}
                    <div className="p-6 border-b border-neon-green/10 bg-gradient-to-b from-neon-green/5 to-transparent">
                        <div className="text-[10px] font-bold text-neon-green uppercase tracking-widest mb-3 font-mono flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" />
                            // INCOMING ASSET STREAM [RX]
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-lg bg-black overflow-hidden border border-neon-green/50 relative group shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,65,0.2)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
                                <img
                                    src={listing.player.photoUrl || "/default-avatar.svg"}
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <div>
                                <div className="font-black text-white text-xl uppercase italic tracking-wider mb-1">{listing.player.fullName}</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-neon-green font-mono bg-neon-green/10 px-2 py-1 rounded border border-neon-green/20">
                                        VAL: {formatCurrency(listing.player.marketValue)}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase border border-white/10 px-2 py-1 rounded">
                                        {listing.player.primaryPos || "FLEX"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Player Selection */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-white/10 bg-black/60 sticky top-0 z-20 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                                <ArrowRight className="w-3 h-3" />
                                // OUTGOING ASSET STREAM [TX]
                            </div>
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH DATABASE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/80 border border-white/20 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] placeholder:text-gray-700 font-mono uppercase transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                            <button
                                onClick={() => setSelectedPlayerId("")}
                                className={`w-full flex items-center gap-4 p-3 border border-transparent rounded-lg transition-all duration-200 text-left relative overflow-hidden group ${selectedPlayerId === ""
                                    ? "bg-neon-cyan/10 border-neon-cyan/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                    : "bg-white/5 hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="w-10 h-10 bg-black/40 flex items-center justify-center border border-white/10 rounded">
                                    <Minus className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold uppercase font-mono group-hover:text-neon-cyan transition-colors">NO ASSET LINKED</div>
                                    <div className="text-[10px] text-gray-500 font-mono">CASH ONLY TRANSACTION</div>
                                </div>
                                {selectedPlayerId === "" && <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />}
                            </button>

                            {filteredPlayers.map(p => {
                                const isLocked = lockedPlayerIds.has(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => !isLocked && setSelectedPlayerId(p.id)}
                                        disabled={isLocked}
                                        className={`w-full flex items-center gap-4 p-3 border border-transparent rounded-lg transition-all duration-200 text-left group relative overflow-hidden ${selectedPlayerId === p.id
                                            ? "bg-neon-cyan/10 border-neon-cyan/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                                            : isLocked
                                                ? "bg-red-900/5 border-red-900/20 opacity-60 cursor-not-allowed grayscale"
                                                : "bg-white/5 hover:bg-white/10 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-black/40 overflow-hidden border border-white/10 rounded relative">
                                            <img
                                                src={p.photoUrl || "/default-avatar.svg"}
                                                alt={p.fullName}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate font-mono flex items-center gap-2 group-hover:text-neon-cyan transition-colors">
                                                {p.fullName}
                                                {isLocked && <Lock className="w-3 h-3 text-red-500" />}
                                            </div>
                                            <div className={`text-[10px] font-mono ${selectedPlayerId === p.id ? "text-neon-cyan" : "text-gray-500"}`}>
                                                VAL: {formatCurrency(p.marketValue)}
                                            </div>
                                        </div>
                                        {selectedPlayerId === p.id && (
                                            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_5px_#06b6d4]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Credits Input */}
                    <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-sm">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                            <Wallet className="w-3 h-3" /> Additional Credits
                        </label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green font-mono text-lg">$</span>
                            <input
                                type="number"
                                className="w-full bg-black border border-white/20 rounded-lg py-3 pl-8 pr-4 text-white text-lg focus:border-neon-green focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] outline-none font-mono transition-all"
                                placeholder="0"
                                value={credits}
                                onChange={(e) => setCredits(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Trade Analysis */}
                <div className="flex-1 p-8 flex flex-col justify-center bg-[#0a0f0a] mt-16 md:mt-16 relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[length:30px_30px] pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,65,0.05),transparent_70%)] pointer-events-none" />

                    <div className="max-w-sm mx-auto w-full space-y-10 relative z-10">

                        <div className="text-center space-y-6">
                            <div className="text-xs font-bold text-neon-cyan uppercase tracking-[0.2em] font-mono flex items-center justify-center gap-2 border border-neon-cyan/30 py-1 px-3 rounded-full inline-block bg-neon-cyan/5">
                                <Terminal className="w-3 h-3" />
                                QUANTUM PROCESSOR [ANALYSIS]
                            </div>

                            <div className="relative py-6">
                                <div className={`text-6xl md:text-7xl font-black tracking-tighter font-mono relative z-10 transition-all duration-500 ${tradeAnalytics.netValue > 0 ? "text-neon-green drop-shadow-[0_0_20px_rgba(0,255,65,0.6)]" : "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                                    }`}>
                                    {tradeAnalytics.netValue > 0 ? "+" : ""}{formatCurrency(tradeAnalytics.netValue)}
                                </div>
                                {/* Gauge Background Effect */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-transparent via-white/5 to-transparent blur-2xl -z-10 rounded-full" />
                            </div>

                            <div className="font-mono text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed border-l-2 border-gray-800 pl-4 text-left">
                                <span className="text-neon-cyan font-bold">{">"} SYSTEM ANALYSIS:</span> Trade protocol indicates {tradeAnalytics.netValue > 0 ? "significant boost" : "potential deficit"} to roster efficiency vectors.
                            </div>
                        </div>

                        {/* Transaction Log Console */}
                        <div className="bg-black/80 border border-neon-green/30 p-5 font-mono text-xs relative overflow-hidden rounded-lg shadow-lg">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50" />

                            <div className="space-y-3 opacity-90">
                                <div className="flex justify-between text-gray-400 border-b border-white/5 pb-2">
                                    <span>[LOG]: TARGET_ASSET_VAL</span>
                                    <span className="text-white font-bold">{formatCurrency(listing.player.marketValue)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 border-b border-white/5 pb-2">
                                    <span>[LOG]: OFFER_TOTAL_VAL</span>
                                    <span className="text-white font-bold">{formatCurrency(tradeAnalytics.outgoingTotal)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-1">
                                    <span className="text-neon-cyan">[RES]: NET_IMPACT_CALC</span>
                                    <span className={`px-2 py-0.5 rounded ${tradeAnalytics.netValue > 0 ? "bg-neon-green/20 text-neon-green" : "bg-red-500/20 text-red-500"}`}>
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
                                    // Handle both property names just in case
                                    leagueKey = selectedPlayer.league?.yahooLeagueKey || selectedPlayer.league?.leagueKey;
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

                            // Check if user already has an active offer for this listing
                            const existingOffer = listing.offers?.find((o: any) =>
                                o.offeredBy === sourceTeamKey &&
                                o.status === 'PENDING'
                            );

                            if (existingOffer) {
                                return (
                                    <div className="w-full py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-center font-bold uppercase tracking-widest">
                                        OFFER ALREADY PENDING
                                    </div>
                                );
                            }

                            // Check if target player is locked
                            if (lockedPlayerIds.has(listing.player.id)) {
                                return (
                                    <div className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 text-center font-bold uppercase tracking-widest flex flex-col gap-1">
                                        <span>TARGET ASSET LOCKED</span>
                                        <span className="text-[10px] opacity-70">Player involved in active trade</span>
                                    </div>
                                );
                            }

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

