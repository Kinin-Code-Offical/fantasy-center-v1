"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import TradeProposalManager from "@/components/TradeProposalManager";
import CyberBackground from "@/components/CyberBackground";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/ToastProvider";
import { ArrowRight, Check, Zap, AlertTriangle, TrendingUp, TrendingDown, X, Coins, Activity, Shield, ScanLine, Loader2, ChevronUp, ChevronDown, Lock } from "lucide-react";

interface Props {
    listing: any;
    userPlayers: any[];
    currentUserId: string;
    leagueName?: string;
    leagueId?: string;
    yahooLeagueKey?: string;
    // YENİ EKLENEN PROPLAR:
    sourceTeamKey?: string;
    targetTeamKey?: string;
    lockedPlayerIds?: string[]; // <--- EKLENDİ
}

export default function TradeOfferInterface({
    listing,
    userPlayers,
    currentUserId,
    leagueName,
    leagueId,
    yahooLeagueKey,
    // Yeni propları alıyoruz
    sourceTeamKey,
    targetTeamKey,
    lockedPlayerIds = [] // <--- EKLENDİ
}: Props) {

    // Helper for Typewriter Effect
    const TypewriterText = ({ text, delay = 0 }: { text: string, delay?: number }) => {
        const [displayedText, setDisplayedText] = useState("");

        useEffect(() => {
            let currentIndex = 0;
            const timeout = setTimeout(() => {
                const interval = setInterval(() => {
                    if (currentIndex <= text.length) {
                        setDisplayedText(text.slice(0, currentIndex));
                        currentIndex++;
                    } else {
                        clearInterval(interval);
                    }
                }, 30); // Typing speed
                return () => clearInterval(interval);
            }, delay);
            return () => clearTimeout(timeout);
        }, [text, delay]);

        return <span>{displayedText}</span>;
    };
    const router = useRouter();
    const { showToast } = useToast();
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
    const [credits, setCredits] = useState<number>(0);
    const [animateUnits, setAnimateUnits] = useState(false);

    const selectedPlayer = userPlayers.find(p => p.id === selectedPlayerId);

    // Trigger unit animation on mount
    useEffect(() => {
        setAnimateUnits(true);
    }, []);

    // Analytics
    const analytics = useMemo(() => {
        const incomingValue = listing.player.marketValue || 0;
        const outgoingPlayerValue = selectedPlayer?.marketValue || 0;
        const outgoingTotal = outgoingPlayerValue + credits;
        const netValue = incomingValue - outgoingTotal;
        const percentDiff = outgoingTotal > 0 ? (netValue / outgoingTotal) * 100 : 0;

        let status = "BALANCED EXCHANGE";
        let color = "text-blue-400";
        let statusColor = "bg-blue-500/10 border-blue-500 text-blue-400";

        if (netValue > 0) {
            status = "OPTIMAL GAIN";
            color = "text-green-400";
            statusColor = "bg-green-500/10 border-green-500 text-green-400 animate-pulse";
        } else if (netValue < 0) {
            status = "SUBOPTIMAL LOSS";
            color = "text-red-400";
            statusColor = "bg-red-500/10 border-red-500 text-red-400";
        }

        const totalVolume = incomingValue + outgoingTotal;
        const incomingWidth = totalVolume > 0 ? (incomingValue / totalVolume) * 100 : 50;
        const outgoingWidth = totalVolume > 0 ? (outgoingTotal / totalVolume) * 100 : 50;

        return { incomingValue, outgoingTotal, netValue, status, color, statusColor, incomingWidth, outgoingWidth };
    }, [listing.player.marketValue, selectedPlayer, credits]);

    return (
        <>
            <CyberBackground />
            <div className="w-full h-auto md:h-full md:overflow-y-auto p-4 md:p-8 pt-24 pb-20 text-white font-sans relative z-10 custom-scrollbar">
                <div className="max-w-7xl mx-auto min-h-full">
                    <div className="flex justify-between items-center mb-8">
                        <BackButton href="/market" label="RETURN TO MARKET" />
                        <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                            Trade Initiation // Protocol Alpha
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">

                        {/* LEFT: YOUR ASSETS (YOU GIVE) */}
                        <div className="flex flex-col bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl order-3 lg:order-1 w-full lg:w-1/3">
                            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Your Assets {leagueName && `// ${leagueName}`}
                                </h2>
                                <span className={`text-xs font-mono text-gray-500 transition-all duration-1000 ${animateUnits ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                                    {userPlayers.length} UNITS AVAILABLE
                                </span>
                            </div>

                            {/* Task 1: Dynamic Slot */}
                            <div className={`p-6 border-b border-white/10 flex flex-col items-center justify-center min-h-[180px] relative group transition-all duration-500 ${selectedPlayer ? "bg-blue-500/10" : "bg-black/40"}`}>
                                {selectedPlayer ? (
                                    <div className="w-full text-center relative z-10 animate-in fade-in zoom-in duration-300">
                                        {/* Holographic Card Effect */}
                                        <div className="relative w-24 h-24 mx-auto rounded-full border-2 border-blue-500 overflow-hidden mb-3 shadow-[0_0_30px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.6)] transition-all">
                                            <div className="absolute inset-0 bg-blue-500/20 animate-pulse z-10" />
                                            <img
                                                src={selectedPlayer.photoUrl || "/default-avatar.svg"}
                                                className="w-full h-full object-cover sepia hue-rotate-180 contrast-125"
                                            />
                                            {/* Scanline */}
                                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,255,0.2)_50%)] bg-[length:100%_4px] pointer-events-none" />
                                        </div>

                                        <div className="font-bold text-lg text-white drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{selectedPlayer.fullName}</div>
                                        <div className="text-blue-400 font-mono text-sm">{formatCurrency(selectedPlayer.marketValue)}</div>

                                        {/* Task 1: Remove Button */}
                                        <button
                                            onClick={() => {
                                                // Sound Effect: Play 'Remove_Asset.wav'
                                                setSelectedPlayerId("");
                                            }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500/20 border border-red-500 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <div className="w-16 h-16 mx-auto border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                            <span className="text-2xl">+</span>
                                        </div>
                                        <div className="text-xs uppercase tracking-widest">Select Asset Below</div>
                                    </div>
                                )}
                                {/* Background Grid */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-black/20 max-h-[500px]">
                                {userPlayers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
                                        <AlertTriangle className="w-8 h-8 mb-2 text-yellow-500/50" />
                                        <div className="text-xs font-bold text-yellow-500/70">NO ASSETS AVAILABLE IN THIS LEAGUE</div>
                                    </div>
                                ) : (
                                    userPlayers.map(p => {
                                        const isLocked = lockedPlayerIds.includes(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                disabled={isLocked}
                                                onClick={() => {
                                                    if (isLocked) return;
                                                    // Sound Effect: Play 'Select_Asset.wav'
                                                    setSelectedPlayerId(p.id);
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 rounded border transition-all duration-200 text-left group relative overflow-hidden ${isLocked
                                                    ? "bg-red-900/10 border-red-900/30 opacity-50 cursor-not-allowed"
                                                    : selectedPlayerId === p.id
                                                        ? "bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                                        : "bg-white/5 border-transparent hover:border-white/20 hover:bg-white/10"
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden flex-shrink-0 border border-white/10 relative">
                                                    <img src={p.photoUrl || "/default-avatar.svg"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                    {isLocked && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <Lock className="w-4 h-4 text-red-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`text-sm font-bold truncate ${isLocked ? "text-gray-500" : "text-gray-200 group-hover:text-white"}`}>{p.fullName}</div>
                                                        {isLocked && <span className="text-[8px] font-mono bg-red-500/20 text-red-500 px-1 rounded">LOCKED</span>}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono group-hover:text-blue-400">{p.primaryPos} • {p.editorialTeam}</div>
                                                </div>
                                                <div className="text-xs font-mono text-blue-500/70 group-hover:text-blue-400">{formatCurrency(p.marketValue)}</div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Task 2: Additional Credits Panel */}
                            <div className="p-6 border-t border-white/10 bg-black/80 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
                                <label className="text-[10px] font-bold text-green-500/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Coins className="w-3 h-3 animate-spin-slow" /> Additional Credits
                                </label>
                                <div className="relative group flex">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={credits}
                                            onChange={(e) => setCredits(Number(e.target.value))}
                                            className="w-full bg-black/50 border border-green-500/30 rounded-l p-3 pl-10 text-right font-mono text-green-400 focus:border-green-500 focus:shadow-[0_0_20px_rgba(34,197,94,0.2)] outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500/50">$</div>
                                    </div>

                                    {/* Custom Spinners */}
                                    <div className="flex flex-col border-y border-r border-green-500/30 rounded-r bg-black/50 w-8">
                                        <button
                                            onClick={() => setCredits(prev => prev + 100000)}
                                            className="flex-1 hover:bg-green-500/20 text-green-500 transition-colors flex items-center justify-center border-b border-green-500/10"
                                        >
                                            <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => setCredits(prev => Math.max(0, prev - 100000))}
                                            className="flex-1 hover:bg-green-500/20 text-green-500 transition-colors flex items-center justify-center"
                                        >
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Animated Input Cursor Effect */}
                                    <div className="absolute bottom-0 left-0 h-[2px] bg-green-500 w-0 group-focus-within:w-full transition-all duration-500" />
                                </div>
                                {/* Value Display */}
                                <div className="mt-2 text-right h-6">
                                    {credits > 0 && (
                                        <div className="text-lg font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            {formatCurrency(credits)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE: TRANSACTION FORECAST (THE HEART) */}
                        <div className="flex flex-col justify-start space-y-6 relative order-2 lg:order-2 w-full lg:w-1/3">
                            {/* Arrows */}
                            <div className="absolute top-1/2 -left-6 -translate-y-1/2 hidden lg:block text-blue-500/30 animate-pulse">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                            <div className="absolute top-1/2 -right-6 -translate-y-1/2 hidden lg:block text-green-500/30 animate-pulse delay-75">
                                <ArrowRight className="w-8 h-8" />
                            </div>

                            <div className="bg-black/60 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-white to-green-500" />

                                <h3 className="text-center text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center justify-center gap-2">
                                    <Activity className="w-4 h-4" /> Transaction Forecast
                                </h3>

                                <div className="flex justify-between items-end mb-2 text-[10px] font-mono text-gray-500 tracking-widest">
                                    <span>OUTGOING VALUATION</span>
                                    <span>INCOMING VALUATION</span>
                                </div>

                                {/* Task 3: Dynamic Bar Animation */}
                                <div className="h-6 bg-gray-900/50 rounded-sm overflow-hidden flex mb-8 relative border border-white/5">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-900 to-blue-500 transition-all duration-700 ease-out relative"
                                        style={{ width: `${analytics.outgoingWidth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:10px_10px]" />
                                    </div>
                                    <div
                                        className="h-full bg-gradient-to-l from-green-900 to-green-500 transition-all duration-700 ease-out relative"
                                        style={{ width: `${analytics.incomingWidth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:10px_10px]" />
                                    </div>
                                </div>

                                <div className="text-center space-y-4 mb-8">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Net Valuation Delta</span>
                                        {/* Task 3: Metric Animation (Simple CSS transition for color/value update) */}
                                        <div className={`text-5xl font-black font-mono ${analytics.color} transition-colors duration-500 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                            {analytics.netValue > 0 ? "+" : ""}{formatCurrency(analytics.netValue)}
                                        </div>
                                    </div>

                                    {/* Task 3: Deal Status Indicator */}
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded border ${analytics.statusColor} transition-all duration-500`}>
                                        {analytics.status === "OPTIMAL GAIN" && <TrendingUp className="w-4 h-4" />}
                                        {analytics.status === "SUBOPTIMAL LOSS" && <TrendingDown className="w-4 h-4" />}
                                        {analytics.status === "BALANCED EXCHANGE" && <Shield className="w-4 h-4" />}
                                        <span className="text-xs font-bold uppercase tracking-widest">{analytics.status}</span>
                                    </div>
                                </div>

                                {/* Task 3: Analytics Readout */}
                                <div className="p-4 bg-black/40 rounded border border-white/5 text-[10px] text-gray-400 font-mono leading-relaxed min-h-[80px]">
                                    <div className="flex gap-2">
                                        <span className="text-green-500">&gt;</span>
                                        <TypewriterText text="ANALYZING ASSET VALUATION..." delay={0} />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-green-500">&gt;</span>
                                        <TypewriterText text="MARKET VOLATILITY: STABLE" delay={1000} />
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-green-500">&gt;</span>
                                        <span>PROJECTED ROSTER IMPACT: </span>
                                        <span className={analytics.status === "OPTIMAL GAIN" ? "text-green-400" : analytics.status === "SUBOPTIMAL LOSS" ? "text-red-400" : "text-blue-400"}>
                                            {analytics.status === "OPTIMAL GAIN" ? "POSITIVE" : analytics.status === "SUBOPTIMAL LOSS" ? "NEGATIVE" : "NEUTRAL"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Task 5: Submit Button - GÜNCELLENMİŞ */}
                            <div className="w-full">
                                {yahooLeagueKey && sourceTeamKey && targetTeamKey && (
                                    <TradeProposalManager
                                        leagueKey={yahooLeagueKey}
                                        // ARTIK DOĞRUDAN PROP OLARAK GELEN DEĞERİ KULLANIYORUZ
                                        sourceTeamKey={sourceTeamKey}
                                        targetTeamKey={targetTeamKey}
                                        gameCode="nba" // Veya dinamik gameCode
                                        offeredPlayerKeys={selectedPlayerId ? [selectedPlayerId] : []}
                                        requestedPlayerKeys={[listing.player.id]}
                                        listingId={listing.id}
                                        offeredCredits={credits}
                                        onSuccess={() => {
                                            showToast("Trade flow complete", "success");
                                            router.push("/market");
                                            router.refresh();
                                        }}
                                    />
                                )}
                                {/* Hata durumunda kullanıcıya bilgi vermek için opsiyonel uyarı */}
                                {(!sourceTeamKey || !targetTeamKey) && (
                                    <div className="text-red-500 text-xs text-center p-2 border border-red-500/50 rounded bg-red-900/20">
                                        ERROR: Team Keys Missing. You may not be in this league.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: TARGET ASSET (YOU RECEIVE) */}
                        <div className="flex flex-col bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl order-1 lg:order-3 w-full lg:w-1/3">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Target Asset
                                </h2>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                {/* Hologram Effect */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_70%)]" />
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(0,0,0,0.5)_2px)] bg-[length:100%_4px] pointer-events-none opacity-20" />

                                {/* Task 4: Holographic Player Image */}
                                <div className="relative w-56 h-56 rounded-full border-4 border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.3)] flex items-center justify-center mb-8 group">
                                    <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-20" />
                                    <img
                                        src={listing.player.photoUrl || "/default-avatar.svg"}
                                        className="w-52 h-52 rounded-full object-cover sepia hue-rotate-[50deg] contrast-125 opacity-90 group-hover:opacity-100 transition-opacity"
                                    />

                                    {/* Task 4: Vertical Scanline */}
                                    <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div className="w-full h-2 bg-green-400/50 blur-sm absolute top-0 animate-scan-vertical" />
                                    </div>

                                    {/* Task 4: Stats Overlay */}
                                    <div className="absolute -bottom-4 bg-black/80 border border-green-500/50 px-4 py-2 rounded backdrop-blur-md flex gap-4 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                        <div className="text-center">
                                            <div className="text-[8px] text-gray-400 uppercase">FANTASY PTS</div>
                                            <div className="text-sm font-bold text-white font-mono">{listing.player.fantasyPoints || "0.0"}</div>
                                        </div>
                                        <div className="w-[1px] bg-white/20" />
                                        <div className="text-center">
                                            <div className="text-[8px] text-gray-400 uppercase">PROJECTED</div>
                                            <div className="text-sm font-bold text-green-400 font-mono">{listing.player.projectedPoints || "0.0"}</div>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2 text-center drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                                    {listing.player.fullName}
                                </h2>
                                <div className="flex gap-2 mb-8">
                                    <span className="px-3 py-1 bg-green-900/30 border border-green-500/30 rounded text-xs font-bold text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                        {listing.player.primaryPos}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-400">
                                        {listing.player.editorialTeam}
                                    </span>
                                </div>

                                {/* Task 4: Seller Request Input Style */}
                                <div className="w-full bg-black/60 border border-green-500/20 rounded p-4 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
                                    <div className="text-[10px] text-green-500/70 font-mono mb-2 flex items-center gap-2">
                                        <ScanLine className="w-3 h-3" /> SELLER REQUEST
                                    </div>
                                    <p className="text-sm text-gray-300 font-mono relative z-10">
                                        {listing.notes ? `> ${listing.notes}` : "> OPEN_FOR_OFFERS"}
                                    </p>
                                    {/* Scanning cursor effect */}
                                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 animate-pulse" />
                                </div>
                            </div>

                            {/* Task 4: Market Value Glow */}
                            <div className="p-6 border-t border-white/10 bg-green-900/10 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                                <span className="text-xs font-bold text-gray-400 uppercase relative z-10">Market Value</span>
                                <span className="text-2xl font-mono font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] relative z-10">
                                    {formatCurrency(listing.player.marketValue)}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}