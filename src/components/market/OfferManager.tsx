"use client";

import { useState, useEffect } from "react";
import { getOffersForListing, acceptOffer, rejectOffer } from "@/lib/actions/market";
import { useToast } from "@/components/ToastProvider";
import { formatCurrency } from "@/lib/format";
import { Check, X, Loader2, Lock, ShieldAlert } from "lucide-react";
import Image from "next/image";

interface OfferManagerProps {
    listingId: string;
    onClose?: () => void;
}

export default function OfferManager({ listingId, onClose }: OfferManagerProps) {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadOffers();
    }, [listingId]);

    const loadOffers = async () => {
        try {
            const data = await getOffersForListing(listingId);
            setOffers(data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load offers", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (offerId: string) => {
        try {
            const result = await acceptOffer(offerId);
            if (result && result.redirectUrl) {
                showToast("REDIRECTING TO YAHOO FOR CONFIRMATION", "success");
                window.open(result.redirectUrl, "_blank");
            } else {
                showToast("PROTOCOL EXECUTED: ASSET TRANSFERRED", "success");
            }
            loadOffers();
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            showToast("EXECUTION ERROR: " + (error instanceof Error ? error.message : "Unknown"), "error");
        }
    };

    const handleReject = async (offerId: string) => {
        try {
            await rejectOffer(offerId);
            showToast("SIGNAL TERMINATED", "info");
            setOffers(prev => prev.filter(o => o.id !== offerId));
        } catch (error) {
            console.error(error);
            showToast("TERMINATION FAILED", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-black text-neon-green font-mono relative overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] opacity-20 animate-pulse" />
                <Loader2 className="w-12 h-12 animate-spin mb-4 relative z-10" />
                <span className="text-sm tracking-[0.2em] animate-pulse relative z-10">ESTABLISHING SECURE CONNECTION...</span>
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 bg-[#050a05] border border-white/10 relative overflow-hidden">
                {onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-50">
                        <X className="w-6 h-6" />
                    </button>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,65,0.05)_50%)] bg-[length:100%_4px]" />
                <ShieldAlert className="w-16 h-16 mb-6 text-gray-600 opacity-50" />
                <h3 className="text-xl font-black text-gray-500 tracking-widest uppercase mb-2">NO ACTIVE SIGNALS</h3>
                <p className="text-xs font-mono text-gray-600 uppercase tracking-wider">Sector Clear. Awaiting Incoming Protocols.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[80vh] md:h-[700px] bg-[#0a0a0a] border border-white/10 relative overflow-hidden shadow-2xl">

            {/* 1. The Stage - Header */}
            <div className="h-16 bg-gradient-to-r from-gray-900 to-black border-b border-white/10 flex items-center justify-between px-6 relative z-20">
                <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-neon-green animate-pulse" />
                    <h2 className="text-lg font-black text-white tracking-[0.2em] uppercase">
                        CONTRACT AUTHORIZATION <span className="text-neon-green text-xs align-top">V.9.0</span>
                    </h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded text-[10px] font-mono text-neon-green">
                        <span className="w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse" />
                        SECURE_CHANNEL_ACTIVE
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.3] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/80 pointer-events-none" />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
                {offers.map((offer) => (
                    <HolographicConsole
                        key={offer.id}
                        offer={offer}
                        onAccept={() => handleAccept(offer.id)}
                        onReject={() => handleReject(offer.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function HolographicConsole({ offer, onAccept, onReject }: any) {
    const [isProcessing, setIsProcessing] = useState(false);

    const youGivePlayer = offer.listing?.player;
    const youGetPlayer = offer.offeredPlayer;
    const youGetCredits = offer.offeredCredits || 0;

    // Calculate Value Delta
    const giveValue = youGivePlayer?.marketValue || 0;
    const getValue = (youGetPlayer?.marketValue || 0) + youGetCredits;
    const delta = getValue - giveValue;
    const isProfit = delta >= 0;

    const handleAction = async (action: () => Promise<void>) => {
        setIsProcessing(true);
        await action();
        setIsProcessing(false);
    };

    return (
        <div className="relative bg-black border border-white/10 mb-8">
            {/* 2. The Terminal Face-Off */}
            <div className="grid grid-cols-1 md:grid-cols-2 relative min-h-[350px]">

                {/* Center Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block z-10" />

                {/* LEFT: OUTGOING (Your Asset) */}
                <div className="relative p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10">
                    <div className="w-full flex justify-between items-center mb-6">
                        <div className="text-xs font-mono text-gray-500">[ YOUR ASSET ]</div>
                        <div className="text-xs font-mono text-red-500">OUTGOING</div>
                    </div>

                    <div className="relative w-48 h-48 mb-4 bg-gray-900 border border-white/10">
                        {youGivePlayer ? (
                            <>
                                <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:10px_10px] opacity-30 pointer-events-none" />
                                <Image
                                    src={youGivePlayer.photoUrl || "/placeholder-player.png"}
                                    alt={youGivePlayer.fullName}
                                    fill
                                    className="object-cover"
                                    style={{ filter: 'sepia(20%) hue-rotate(90deg)' }}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-xs">NO_ASSET</div>
                        )}
                    </div>

                    <div className="w-full text-center mb-4">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">{youGivePlayer?.fullName || "UNKNOWN"}</h3>
                        <p className="text-xs font-mono text-gray-500">{youGivePlayer?.primaryPos || "N/A"} // {youGivePlayer?.team || "FA"}</p>
                    </div>

                    {/* Stats Table */}
                    {youGivePlayer && (
                        <div className="w-full grid grid-cols-3 gap-px bg-white/10 border border-white/10">
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">PTS</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">REB</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">AST</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: INCOMING (Their Offer) */}
                <div className="relative p-6 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-6">
                        <div className="text-xs font-mono text-neon-green">INCOMING</div>
                        <div className="text-xs font-mono text-gray-500">[ OFFERED ASSET ]</div>
                    </div>

                    <div className="relative w-48 h-48 mb-4 bg-gray-900 border border-white/10">
                        {youGetPlayer ? (
                            <>
                                <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:10px_10px] opacity-30 pointer-events-none" />
                                <Image
                                    src={youGetPlayer.photoUrl || "/placeholder-player.png"}
                                    alt={youGetPlayer.fullName}
                                    fill
                                    className="object-cover"
                                    style={{ filter: 'sepia(20%) hue-rotate(90deg)' }}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neon-green font-mono text-xs">CASH_ONLY</div>
                        )}
                    </div>

                    <div className="w-full text-center mb-4">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">{youGetPlayer?.fullName || "CREDITS"}</h3>
                        <p className="text-xs font-mono text-gray-500">
                            {youGetPlayer ? `${youGetPlayer.primaryPos} // ${youGetPlayer.team}` : "LIQUID ASSET"}
                        </p>
                        {youGetCredits > 0 && (
                            <div className="mt-1 text-xs font-mono text-neon-green">
                                + {formatCurrency(youGetCredits)}
                            </div>
                        )}
                    </div>

                    {/* Stats Table */}
                    {youGetPlayer && (
                        <div className="w-full grid grid-cols-3 gap-px bg-white/10 border border-white/10">
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">PTS</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">REB</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                            <div className="bg-black p-2 text-center">
                                <div className="text-[10px] text-gray-500">AST</div>
                                <div className="text-xs font-mono text-white">--</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. The System Log (Center Overlay) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-64 bg-black border border-neon-green/50 p-4 shadow-2xl">
                    <div className="font-mono text-[10px] text-neon-green space-y-1 leading-tight">
                        <div className="opacity-50">{`> CALCULATING DELTA...`}</div>
                        <div className="flex justify-between">
                            <span>{`> INCOMING:`}</span>
                            <span>{formatCurrency(getValue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{`> OUTGOING:`}</span>
                            <span>{formatCurrency(giveValue)}</span>
                        </div>
                        <div className="h-px bg-neon-green/30 my-1" />
                        <div className="flex justify-between font-bold">
                            <span>{`> NET DIFF:`}</span>
                            <span className={isProfit ? "text-neon-green" : "text-red-500"}>
                                {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                            </span>
                        </div>
                        <div className="mt-2 animate-pulse">
                            {`> ${isProfit ? '[PROFIT DETECTED]' : '[LOSS WARNING]'}_`}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Mechanical Switches (Footer) */}
            <div className="grid grid-cols-2 border-t border-white/10">
                <button
                    onClick={() => handleAction(onReject)}
                    disabled={isProcessing}
                    className="h-14 bg-black border-r border-white/10 text-red-500 font-mono text-xs tracking-widest hover:bg-red-500 hover:text-black transition-colors flex items-center justify-center gap-2 uppercase"
                >
                    <X className="w-4 h-4" />
                    REJECT_OFFER
                </button>

                <button
                    onClick={() => handleAction(onAccept)}
                    disabled={isProcessing}
                    className="h-14 bg-black text-neon-green font-mono text-xs tracking-widest hover:bg-neon-green hover:text-black transition-colors flex items-center justify-center gap-2 uppercase"
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    ACCEPT_OFFER
                </button>
            </div>
        </div>
    );
}
