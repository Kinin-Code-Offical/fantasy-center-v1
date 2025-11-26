"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRightLeft, Check, X, Ban, Radar, ExternalLink } from "lucide-react";
import { acceptOffer, rejectOffer, cancelOffer } from "@/lib/actions/market";
import { syncUserTrades } from "@/lib/actions/trade-actions";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { formatCurrency } from "@/lib/format";
import TradeActionManager from "@/components/TradeActionManager";
import { useToast } from "@/components/ToastProvider";

interface TradeConsoleProps {
    incomingListings: any[];
    outgoingOffers: any[];
    externalTrades: any[];
    userTeamKeys: string[];
}

export default function TradeConsole({ incomingListings, outgoingOffers, externalTrades, userTeamKeys }: TradeConsoleProps) {
    const [activeTab, setActiveTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');
    const router = useRouter();
    const { showToast } = useToast();
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Auto-Sync on Mount
    useEffect(() => {
        const runSync = async () => {
            setIsSyncing(true);
            try {
                const res = await syncUserTrades();
                if (res.success) {
                    router.refresh();
                }
            } catch (e) {
                console.error("Background sync failed", e);
            } finally {
                setIsSyncing(false);
            }
        };
        runSync();
    }, []);

    // Flatten incoming offers for display
    const incomingOffers = incomingListings.flatMap(listing =>
        listing.offers.map((offer: any) => ({
            ...offer,
            listing: listing, // Attach listing to offer for easy access
            type: 'LOCAL'
        }))
    );

    // Mark outgoing offers as local
    const localOutgoing = outgoingOffers.map(offer => ({ ...offer, type: 'LOCAL' }));

    // Split Yahoo trades into Incoming/Outgoing
    const yahooIncoming = externalTrades.filter(t => userTeamKeys.includes(t.offeredTo)).map(t => ({ ...t, type: 'EXTERNAL' }));
    const yahooOutgoing = externalTrades.filter(t => userTeamKeys.includes(t.offeredBy)).map(t => ({ ...t, type: 'EXTERNAL' }));

    // Merge and Sort
    const allIncoming = [...incomingOffers, ...yahooIncoming].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const allOutgoing = [...localOutgoing, ...yahooOutgoing].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const displayItems = activeTab === 'INCOMING' ? allIncoming : allOutgoing;

    const handleAction = async (action: Function, id: string) => {
        try {
            await action(id);
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-20">
            {/* Sync Indicator */}
            {isSyncing && (
                <div className="fixed top-24 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md border border-green-500/30 rounded-full animate-in slide-in-from-right fade-in duration-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Syncing with Yahoo...</span>
                </div>
            )}

            <style jsx global>{`
                @keyframes slam {
                    0% { transform: scale(3); opacity: 0; }
                    50% { transform: scale(1) rotate(-5deg); opacity: 1; }
                    70% { transform: scale(1.1) rotate(-5deg); }
                    100% { transform: scale(1) rotate(-5deg); opacity: 1; }
                }
                @keyframes stamp-void {
                    0% { transform: scale(3); opacity: 0; }
                    100% { transform: scale(1) rotate(15deg); opacity: 1; }
                }
                .animate-slam { animation: slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-stamp-void { animation: stamp-void 0.3s ease-in forwards; }
                
                @keyframes scan {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: scan 4s linear infinite; }

                @keyframes hologram {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            <div className="mb-8">
                <BackButton href="/dashboard" label="RETURN TO BASE" />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-mono font-bold text-white tracking-[0.2em] flex items-center gap-3 uppercase">
                            <span className="text-neon-green">{">"}</span> TRADE_OPS <span className="text-gray-500">//</span> SIGNALS <span className="animate-pulse text-neon-green">_</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2 pl-6">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-mono text-red-500 tracking-widest uppercase">Live Feed Active</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full border-b border-white/10 mb-8 bg-black/20 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('INCOMING')}
                        className={`flex-1 py-4 text-center font-mono font-bold tracking-widest transition-all duration-300 relative group ${activeTab === 'INCOMING'
                            ? 'text-neon-green bg-neon-green/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <span className="mr-2 opacity-50 group-hover:opacity-100 transition-opacity">[</span>
                        RX: INCOMING
                        <span className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity">]</span>
                        <span className="text-xs ml-2 bg-white/10 px-2 py-0.5 rounded text-white">{allIncoming.length}</span>
                        {activeTab === 'INCOMING' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('OUTGOING')}
                        className={`flex-1 py-4 text-center font-mono font-bold tracking-widest transition-all duration-300 relative group ${activeTab === 'OUTGOING'
                            ? 'text-neon-cyan bg-neon-cyan/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <span className="mr-2 opacity-50 group-hover:opacity-100 transition-opacity">[</span>
                        TX: OUTGOING
                        <span className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity">]</span>
                        <span className="text-xs ml-2 bg-white/10 px-2 py-0.5 rounded text-white">{allOutgoing.length}</span>
                        {activeTab === 'OUTGOING' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6 min-h-[400px]">
                {displayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-500 relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md">
                        {/* Radar Effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.05)_0%,transparent_70%)]" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-48 h-48 rounded-full border border-white/10 flex items-center justify-center relative mb-8 bg-black/50">
                                {/* Rotating Scan */}
                                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,65,0.2)_360deg)] animate-spin-slow" />
                                {/* Grid Lines */}
                                <div className="absolute inset-0 border border-white/5 rounded-full scale-75" />
                                <div className="absolute inset-0 border border-white/5 rounded-full scale-50" />
                                <div className="absolute w-full h-px bg-white/10 top-1/2 -translate-y-1/2" />
                                <div className="absolute h-full w-px bg-white/10 left-1/2 -translate-x-1/2" />

                                {/* Blips */}
                                <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-ping opacity-0" style={{ animationDelay: '1s', animationDuration: '3s' }} />
                                <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-ping opacity-0" style={{ animationDelay: '2.5s', animationDuration: '4s' }} />

                                <Radar className="w-8 h-8 text-neon-green/50" />
                            </div>
                            <p className="text-xl font-mono text-neon-green animate-pulse tracking-widest uppercase">Scanning Sector...</p>
                            <p className="text-sm font-mono text-gray-600 mt-2 uppercase tracking-widest">No Active Signals</p>
                        </div>
                    </div>
                ) : (
                    displayItems.map((item: any) => (
                        item.type === 'EXTERNAL' ? (
                            <YahooTradeCard key={item.id} trade={item} userTeamKeys={userTeamKeys} />
                        ) : (
                            <TradeCard
                                key={item.id}
                                item={item}
                                isIncoming={activeTab === 'INCOMING'}
                                onAccept={() => handleAction(acceptOffer, item.id)}
                                onDecline={() => handleAction(rejectOffer, item.id)}
                                onCancel={() => handleAction(cancelOffer, item.id)}
                                isLoading={loadingId === item.id}
                                userTeamKeys={userTeamKeys}
                            />
                        )
                    ))
                )}
            </div>
        </div>
    );
}

function YahooTradeCard({ trade, userTeamKeys }: { trade: any, userTeamKeys: string[] }) {
    const giving = trade.items.filter((i: any) => userTeamKeys.includes(i.senderTeamKey));
    const getting = trade.items.filter((i: any) => userTeamKeys.includes(i.receiverTeamKey));

    return (
        <div className="relative group transition-all duration-300 hover:brightness-125">
            <div className="relative bg-black/80 backdrop-blur-md border-l-4 border-purple-500 overflow-hidden"
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none" />

                <div className="flex flex-col md:flex-row min-h-[160px]">
                    {/* Meta */}
                    <div className="w-full md:w-48 bg-black/40 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col justify-between">
                        <div>
                            <div className="text-[10px] font-mono font-bold tracking-widest uppercase mb-1 text-purple-400">
                                YAHOO_SYNC
                            </div>
                            <div className="text-sm font-mono text-white tracking-wider truncate" title={trade.yahooTradeId || 'N/A'}>
                                #{trade.yahooTradeId?.slice(0, 8) || 'LOCAL'}...
                            </div>
                            <div className="mt-1 inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-mono rounded border border-purple-500/30 uppercase">
                                {trade.status}
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-2">
                            {new Date(trade.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-8 relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.03] pointer-events-none" />

                        {/* Giving (Outgoing) */}
                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Outgoing</div>
                            <div className="flex gap-2">
                                {giving.length > 0 ? giving.map((item: any) => (
                                    <div key={item.id} className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-900 relative flex items-center justify-center border border-red-500/30" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                            <div className="absolute inset-0.5 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                                {item.player ? (
                                                    <Image src={item.player.photoUrl || "/default-avatar.svg"} alt={item.player.fullName} fill sizes="64px" className="object-cover grayscale hover:grayscale-0 transition-all" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">?</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-400 mt-1 max-w-[64px] truncate text-center">{item.player?.fullName}</div>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-600 font-mono italic">Nothing</div>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-1 flex flex-col items-center justify-center px-4">
                            <div className="w-full h-px bg-white/10 relative">
                                <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_currentColor] animate-ping" style={{ left: '50%' }} />
                                <div className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
                            </div>
                        </div>

                        {/* Getting (Incoming) */}
                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className="text-[10px] font-bold text-neon-green uppercase tracking-wider mb-1">Incoming</div>
                            <div className="flex gap-2">
                                {getting.length > 0 ? getting.map((item: any) => (
                                    <div key={item.id} className="flex flex-col items-center">
                                        <div className="w-16 h-16 bg-gray-900 relative flex items-center justify-center border border-neon-green/30" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                            <div className="absolute inset-0.5 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                                {item.player ? (
                                                    <Image src={item.player.photoUrl || "/default-avatar.svg"} alt={item.player.fullName} fill sizes="64px" className="object-cover grayscale hover:grayscale-0 transition-all" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">?</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-400 mt-1 max-w-[64px] truncate text-center">{item.player?.fullName}</div>
                                    </div>
                                )) : (
                                    <div className="text-xs text-gray-600 font-mono italic">Nothing</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="w-full md:w-48 bg-black/40 border-t md:border-t-0 md:border-l border-white/10 p-6 flex items-center justify-center">
                        <a
                            href={`https://sports.yahoo.com/fantasy`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-mono text-xs font-bold uppercase"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Yahoo
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TradeCard({ item, isIncoming, onAccept, onDecline, onCancel, isLoading, userTeamKeys = [] }: any) {
    const [decisionStatus, setDecisionStatus] = useState<'IDLE' | 'ACCEPTED' | 'REJECTED'>('IDLE');
    const router = useRouter();

    const youGivePlayer = isIncoming ? item.listing.player : item.offeredPlayer;
    const youGetPlayer = isIncoming ? item.offeredPlayer : item.listing.player;
    const youGiveCredits = isIncoming ? 0 : item.offeredCredits;
    const youGetCredits = isIncoming ? item.offeredCredits : 0;

    // 1. The Math Logic
    const giveValue = (youGivePlayer?.marketValue || 0) + (youGiveCredits || 0);
    const getValue = (youGetPlayer?.marketValue || 0) + (youGetCredits || 0);
    const netDelta = getValue - giveValue;
    const isWinning = netDelta >= 0;

    // Helper to extract league info from Yahoo Transaction ID
    // Format: {gameId}.l.{leagueId}.tr.{transactionId}
    // League Key: {gameId}.l.{leagueId}
    const getYahooContext = () => {
        if (!item.yahooTransactionId) return { leagueKey: '', gameCode: '', teamId: '' };

        let leagueKey = item.yahooTransactionId;

        // Handle .tr. (completed/proposed) and .pt. (pending trade)
        if (leagueKey.includes('.tr.')) {
            leagueKey = leagueKey.split('.tr.')[0];
        } else if (leagueKey.includes('.pt.')) {
            leagueKey = leagueKey.split('.pt.')[0];
        } else {
            // Fallback: split by dots and take first 3 parts
            const parts = leagueKey.split('.');
            if (parts.length >= 3) {
                leagueKey = parts.slice(0, 3).join('.');
            }
        }

        // Get game code from player data if available, otherwise fallback or parse
        // item.listing.player.game.code should be available now
        const gameCode = item.listing?.player?.game?.code || 'nba';

        // Find user's team ID for this league
        // userTeamKeys format: {gameId}.l.{leagueId}.t.{teamId}
        const matchingTeamKey = userTeamKeys.find((k: string) => k.startsWith(leagueKey + '.t.'));
        const teamId = matchingTeamKey ? matchingTeamKey.split('.t.')[1] : undefined;

        return { leagueKey, gameCode, teamId };
    };

    const { leagueKey, gameCode, teamId } = getYahooContext();

    const handleAccept = async () => {
        setDecisionStatus('ACCEPTED');
        await new Promise(resolve => setTimeout(resolve, 1500));
        onAccept();
    };

    const handleReject = async () => {
        setDecisionStatus('REJECTED');
        await new Promise(resolve => setTimeout(resolve, 1500));
        onDecline();
    };

    const handleYahooSuccess = async (type: 'accept' | 'reject' | 'cancel') => {
        if (type === 'accept') {
            setDecisionStatus('ACCEPTED');
            await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (type === 'reject') {
            setDecisionStatus('REJECTED');
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        router.refresh();
    };

    const signalColor = isIncoming ? "border-neon-green" : "border-amber-500";
    const signalText = isIncoming ? "text-neon-green" : "text-amber-500";
    const signalBg = isIncoming ? "bg-neon-green" : "bg-amber-500";
    const gradientColor = isIncoming ? "via-neon-green" : "via-amber-500";

    return (
        <div
            className={`relative group transition-all duration-300 hover:brightness-125 ${decisionStatus === 'REJECTED' ? 'grayscale opacity-50' : ''}`}
            style={{ filter: decisionStatus === 'REJECTED' ? 'grayscale(100%) opacity(0.5)' : 'none' }}
        >
            {/* Main Container with Clip Path */}
            <div
                className={`relative bg-black/80 backdrop-blur-md border-l-4 ${signalColor} overflow-hidden`}
                style={{
                    clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
                }}
            >
                {/* Scanline Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none" />
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none`} />

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${signalColor}`}></div>
                    </div>
                )}

                {/* STAMP OVERLAYS */}
                {decisionStatus === 'ACCEPTED' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm">
                        <div className="animate-slam border-8 border-neon-green text-neon-green px-8 py-4 rounded-lg transform -rotate-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">SEALED</h2>
                        </div>
                    </div>
                )}
                {decisionStatus === 'REJECTED' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm">
                        <div className="animate-stamp-void border-8 border-red-600 text-red-600 px-12 py-6 rounded-lg transform rotate-12 opacity-90 mix-blend-hard-light">
                            <h2 className="text-5xl md:text-7xl font-black tracking-widest uppercase font-mono">VOID</h2>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row min-h-[160px]">

                    {/* COL 1: ID & META */}
                    <div className="w-full md:w-48 bg-black/40 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col justify-between relative">
                        <div>
                            <div className={`text-[10px] font-mono font-bold tracking-widest uppercase mb-1 ${signalText}`}>
                                SIGNAL_ID
                            </div>
                            <div className="text-lg font-mono text-white tracking-wider">
                                #{item.id.slice(0, 6).toUpperCase()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] text-gray-500 font-mono">
                                {new Date(item.createdAt).toLocaleDateString("en-GB")}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Fake Barcode */}
                        <div className="h-8 w-full opacity-50 mt-4 flex items-end gap-0.5">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="bg-white" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: `${Math.random() * 100}%` }} />
                            ))}
                        </div>
                    </div>

                    {/* COL 2: THE EXCHANGE */}
                    <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-8 relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.03] pointer-events-none" />

                        {/* Left Side (You Give) */}
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className="w-20 h-20 bg-gray-900 relative flex items-center justify-center border border-red-500/30 group-hover:border-red-500 transition-colors duration-500" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                {youGivePlayer ? (
                                    <div className="absolute inset-0.5 bg-black overflow-hidden" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                        {/* Holographic Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" style={{ backgroundSize: "200% 200%", animation: "hologram 3s linear infinite" }} />
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(239,68,68,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />

                                        <Image src={youGivePlayer.photoUrl || "/default-avatar.svg"} alt={youGivePlayer.fullName} fill sizes="80px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-red-500">CASH</div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Outgoing</div>
                                <div className="text-sm font-mono text-white font-bold">{youGivePlayer ? youGivePlayer.fullName : 'CREDITS'}</div>
                                {youGiveCredits > 0 && <div className="text-xs text-red-400 font-mono">+ {formatCurrency(youGiveCredits)}</div>}
                            </div>
                        </div>

                        {/* Data Flow Arrow */}
                        <div className="flex-1 flex flex-col items-center justify-center px-4">
                            <div className="w-full h-px bg-white/10 relative">
                                <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 ${signalBg} rounded-full shadow-[0_0_10px_currentColor] animate-ping`} style={{ left: '50%' }} />
                                <div className={`absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent ${gradientColor} to-transparent opacity-50`} />
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase">Transfer Protocol</div>
                        </div>

                        {/* Right Side (You Get) */}
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className="w-20 h-20 bg-gray-900 relative flex items-center justify-center border border-neon-green/30 group-hover:border-neon-green transition-colors duration-500" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                {youGetPlayer ? (
                                    <div className="absolute inset-0.5 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                        {/* Holographic Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" style={{ backgroundSize: "200% 200%", animation: "hologram 3s linear infinite" }} />
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,65,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />

                                        <Image src={youGetPlayer.photoUrl || "/default-avatar.svg"} alt={youGetPlayer.fullName} fill sizes="80px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    </div>
                                ) : (
                                    <div className="text-xs font-bold text-neon-green">CASH</div>
                                )}
                            </div>
                            <div className="text-center">
                                <div className="text-xs font-bold text-neon-green uppercase tracking-wider">Incoming</div>
                                <div className="text-sm font-mono text-white font-bold">{youGetPlayer ? youGetPlayer.fullName : 'CREDITS'}</div>
                                {youGetCredits > 0 && <div className="text-xs text-neon-green font-mono">+ {formatCurrency(youGetCredits)}</div>}
                            </div>
                        </div>
                    </div>

                    {/* COL 3: ANALYSIS & ACTIONS */}
                    <div className="w-full md:w-64 bg-black/40 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
                        {/* Analysis Gauge */}
                        <div className="relative z-10">
                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Net Impact Analysis</div>
                            <div className={`text-3xl font-black font-mono tracking-tighter ${isWinning ? 'text-neon-green drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)] glitch-effect'}`}>
                                {netDelta > 0 ? '+' : ''}{formatCurrency(netDelta)}
                            </div>
                            <div className={`text-xs font-bold uppercase mt-1 ${isWinning ? 'text-neon-green' : 'text-red-500'}`}>
                                {isWinning ? 'PROFITABLE' : 'LOSS DETECTED'}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-2 relative z-10">
                            {isIncoming ? (
                                <>
                                    {item.yahooTransactionId ? (
                                        <div className="flex-1">
                                            <TradeActionManager
                                                leagueKey={leagueKey}
                                                gameCode={gameCode}
                                                transactionId={item.yahooTransactionId}
                                                teamId={teamId}
                                                action="reject"
                                                onSuccess={() => handleYahooSuccess('reject')}
                                            >
                                                {(runAction, isActionLoading) => (
                                                    <button
                                                        onClick={runAction}
                                                        disabled={decisionStatus !== 'IDLE' || isLoading || isActionLoading}
                                                        className="w-full py-2 rounded-sm border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono text-xs font-bold uppercase flex items-center justify-center"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </TradeActionManager>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleReject}
                                            disabled={decisionStatus !== 'IDLE' || isLoading}
                                            className="flex-1 py-2 rounded-sm border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono text-xs font-bold uppercase"
                                        >
                                            <X className="w-4 h-4 mx-auto" />
                                        </button>
                                    )}

                                    {item.yahooTransactionId ? (
                                        <div className="flex-1">
                                            <TradeActionManager
                                                leagueKey={leagueKey}
                                                gameCode={gameCode}
                                                transactionId={item.yahooTransactionId}
                                                teamId={teamId}
                                                action="accept"
                                                onSuccess={() => handleYahooSuccess('accept')}
                                            >
                                                {(runAction, isActionLoading) => (
                                                    <button
                                                        onClick={runAction}
                                                        disabled={decisionStatus !== 'IDLE' || isLoading || isActionLoading}
                                                        className="w-full py-2 rounded-sm bg-neon-green text-black font-mono text-xs font-bold uppercase hover:bg-white transition-all flex items-center justify-center"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </TradeActionManager>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleAccept}
                                            disabled={decisionStatus !== 'IDLE' || isLoading}
                                            className="flex-1 py-2 rounded-sm bg-neon-green text-black font-mono text-xs font-bold uppercase hover:bg-white transition-all"
                                        >
                                            <Check className="w-4 h-4 mx-auto" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                item.yahooTransactionId ? (
                                    <div className="w-full">
                                        <TradeActionManager
                                            leagueKey={leagueKey}
                                            gameCode={gameCode}
                                            transactionId={item.yahooTransactionId}
                                            teamId={teamId}
                                            action="cancel"
                                            onSuccess={() => handleYahooSuccess('cancel')}
                                        >
                                            {(runAction, isActionLoading) => (
                                                <button
                                                    onClick={runAction}
                                                    disabled={isLoading || isActionLoading}
                                                    className="w-full py-2 rounded-sm border border-gray-600 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-mono text-xs font-bold uppercase flex items-center justify-center gap-2"
                                                >
                                                    <Ban className="w-3 h-3" /> Revoke
                                                </button>
                                            )}
                                        </TradeActionManager>
                                    </div>
                                ) : (
                                    <button
                                        onClick={onCancel}
                                        disabled={isLoading}
                                        className="w-full py-2 rounded-sm border border-gray-600 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-mono text-xs font-bold uppercase flex items-center justify-center gap-2"
                                    >
                                        <Ban className="w-3 h-3" /> Revoke
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
