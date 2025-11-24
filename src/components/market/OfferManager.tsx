"use client";

import { useState, useEffect } from "react";
import { getOffersForListing, acceptOffer, rejectOffer } from "@/lib/actions/market";
import { useToast } from "@/components/ToastProvider";
import { formatCurrency } from "@/lib/format";
import { Check, X, Loader2, AlertTriangle, User, ArrowRight } from "lucide-react";

interface OfferManagerProps {
    listingId: string;
    onClose?: () => void;
}

export default function OfferManager({ listingId, onClose }: OfferManagerProps) {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
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
        setProcessingId(offerId);
        try {
            await acceptOffer(offerId);
            showToast("CONTRACT EXECUTED SUCCESSFULLY", "success");
            loadOffers(); // Refresh or close
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            showToast("EXECUTION FAILED: " + (error instanceof Error ? error.message : "Unknown"), "error");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (offerId: string) => {
        setProcessingId(offerId);
        try {
            await rejectOffer(offerId);
            showToast("OFFER REJECTED", "info");
            // Remove from list locally to avoid full reload flicker
            setOffers(prev => prev.filter(o => o.id !== offerId));
        } catch (error) {
            console.error(error);
            showToast("REJECTION FAILED", "error");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-green-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-xs font-mono animate-pulse">SCANNING FREQUENCIES...</span>
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-white/10 bg-black/40 rounded-xl p-8">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-gray-400">NO INCOMING CONTRACTS</h3>
                <p className="text-xs font-mono text-gray-600 mt-2">Your listing has not received any offers yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {offers.map((offer) => (
                <div key={offer.id} className="bg-black/60 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group relative">
                    {/* Header: Offerer */}
                    <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                {offer.offerer.avatarUrl ? (
                                    <img src={offer.offerer.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-full h-full p-1 text-gray-500" />
                                )}
                            </div>
                            <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Proposed By</div>
                                <div className="text-sm font-bold text-white">{offer.offerer.username}</div>
                            </div>
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                            {new Date(offer.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    {/* Offer Content */}
                    <div className="p-4 grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                        {/* THEY OFFER (You Receive) */}
                        <div className="text-center">
                            <div className="text-[10px] text-green-500 font-bold mb-2 uppercase">Receiving</div>
                            {offer.offeredPlayer ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full border border-green-500/30 overflow-hidden mb-1">
                                        {offer.offeredPlayer.photoUrl ? (
                                            <img src={offer.offeredPlayer.photoUrl} className="w-full h-full object-cover" />
                                        ) : <div className="w-full h-full bg-gray-800" />}
                                    </div>
                                    <div className="text-xs font-bold text-white truncate max-w-[100px]">{offer.offeredPlayer.fullName}</div>
                                    <div className="text-[10px] text-green-400">{formatCurrency(offer.offeredPlayer.marketValue)}</div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic py-4">No Player</div>
                            )}

                            {offer.offeredCredits > 0 && (
                                <div className="mt-2 text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                                    + {formatCurrency(offer.offeredCredits)}
                                </div>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-600">
                            <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* YOU GIVE (Listing Player) */}
                        <div className="text-center opacity-50 grayscale">
                            <div className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Giving</div>
                            <div className="text-xs text-gray-400">Your Listing Asset</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-black/80 border-t border-white/5 flex gap-2">
                        <button
                            onClick={() => handleReject(offer.id)}
                            disabled={!!processingId}
                            className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2"
                        >
                            {processingId === offer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Reject
                        </button>
                        <button
                            onClick={() => handleAccept(offer.id)}
                            disabled={!!processingId}
                            className="flex-1 py-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        >
                            {processingId === offer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Accept Contract
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
