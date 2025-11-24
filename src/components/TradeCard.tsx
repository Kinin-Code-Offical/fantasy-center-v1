"use client";

import { useState } from "react";
import Link from "next/link";
import ConfirmationModal from "./ConfirmationModal";
import OfferManager from "@/components/market/OfferManager";
import { formatCurrency } from "@/lib/format";
import { cancelListing } from "@/lib/actions/market";
import { X } from "lucide-react";

interface Props {
    listing: any;
    userPlayers: any[];
    currentUserId: string;
}

export default function TradeCard({ listing, userPlayers, currentUserId }: Props) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showOfferManager, setShowOfferManager] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const isOwner = currentUserId === listing.sellerId;
    const pendingOfferCount = listing.offers?.filter((o: any) => o.status === "PENDING").length || 0;

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        setIsCancelling(true);
        try {
            await cancelListing(listing.id);
            setShowCancelModal(false);
        } catch (error) {
            console.error(error);
            alert("Failed to cancel listing");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancel}
                title="Revoke Listing?"
                message="This action cannot be undone. The asset will be removed from the market immediately."
                confirmText="Yes, Revoke"
                isProcessing={isCancelling}
            />

            {showOfferManager && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative z-[101] bg-[#0a0a12] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Contract Review Console
                            </h2>
                            <button onClick={() => setShowOfferManager(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-black/40 overflow-hidden flex-1">
                            <OfferManager listingId={listing.id} onClose={() => setShowOfferManager(false)} />
                        </div>
                    </div>
                </div>
            )}

            <div className="group relative bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-500 flex flex-col h-[500px] backdrop-blur-sm">
                {/* Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-10"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #22c55e 3px)" }} />

                {/* Vertical Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none z-0" />

                {/* Header: Seller Info */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black border border-green-500/30 flex items-center justify-center overflow-hidden">
                            {listing.seller.avatarUrl ? (
                                <img src={listing.seller.avatarUrl} alt={listing.seller.username} className="w-full h-full object-cover grayscale" />
                            ) : (
                                <span className="text-[10px] font-bold text-green-500">{listing.seller.username?.substring(0, 1)}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider leading-none">{listing.seller.username}</span>
                            <span className="text-[8px] text-green-500/70 font-mono">ID: {listing.sellerId.substring(0, 6)}</span>
                        </div>
                    </div>

                    {/* Market Value Badge */}
                    <div className="px-3 py-1 bg-black/80 border border-green-500/50 rounded-full backdrop-blur-sm shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        <span className="text-xs font-bold text-green-400 font-mono tracking-wider">
                            {formatCurrency(listing.player.marketValue)}
                        </span>
                    </div>
                </div>

                {/* Main Asset Image (Hologram Style) */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden z-10 mt-8">
                    {/* Glowing Circle Container */}
                    <div className="relative w-40 h-40 rounded-full border-2 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)] flex items-center justify-center group-hover:border-green-400 group-hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all duration-500">
                        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping opacity-20" />

                        {listing.player.photoUrl ? (
                            <div className="w-36 h-36 rounded-full overflow-hidden relative">
                                <img
                                    src={listing.player.photoUrl}
                                    alt={listing.player.fullName}
                                    className="w-full h-full object-cover sepia hue-rotate-[50deg] contrast-125 opacity-90 group-hover:opacity-100 transition-all duration-500"
                                />
                                {/* Glitch/Scan effect on image */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />
                            </div>
                        ) : (
                            <div className="text-6xl opacity-50 text-green-500">👤</div>
                        )}
                    </div>

                    {/* Player Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-20">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">
                            {listing.player.fullName}
                        </h3>
                        <div className="flex items-center justify-center gap-3 mt-1">
                            <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">
                                {listing.player.primaryPos}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                {listing.player.editorialTeam}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Request / Terminal Readout */}
                <div className="p-4 bg-black/60 border-t border-white/10 relative overflow-hidden z-10 backdrop-blur-sm">
                    <div className="font-mono text-[10px] text-green-500/70 mb-1 flex items-center gap-2">
                        <span className="animate-pulse">_REQUEST_DATA</span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono line-clamp-2 min-h-[2.5em]">
                        {listing.notes ? `> ${listing.notes}` : "> OPEN_FOR_OFFERS"}
                    </p>
                </div>

                {/* Action Button */}
                <div className="p-3 bg-black/80 border-t border-white/5 z-10">
                    {isOwner ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowOfferManager(true)}
                                className="flex-1 py-3 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group/btn"
                            >
                                <span className="relative z-10">REVIEW OFFERS ({pendingOfferCount})</span>
                                {pendingOfferCount > 0 && (
                                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                                )}
                            </button>
                            <button
                                onClick={handleCancelClick}
                                disabled={isCancelling}
                                className="w-12 py-3 border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-300 rounded"
                                title="Revoke Listing"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href={`/market/${listing.id}/offer`}
                            className="block w-full py-3 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-black text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group/btn text-center"
                        >
                            <span className="relative z-10">Initiate Offer Protocol</span>
                            <div className="absolute inset-0 bg-green-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}
