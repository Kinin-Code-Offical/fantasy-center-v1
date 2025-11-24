"use client";

import { useState, useMemo } from "react";
import { makeOffer } from "@/lib/actions/market";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Trade Analytics (Profit/Loss Calculation)
    // Fixed: Using useMemo to prevent infinite render loops caused by useEffect state updates
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await makeOffer(listing.id, selectedPlayerId, credits);
            showToast("Offer sent successfully", "success");
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Failed to make offer: " + (error instanceof Error ? error.message : "Unknown Error"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a12] border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

                {/* Left: Offer Form */}
                <div className="flex-1 p-6 space-y-6 border-r border-white/10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Make an Offer</h3>
                    </div>

                    {/* Target */}
                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="w-10 h-10 rounded bg-gray-800 overflow-hidden">
                            {listing.player.photoUrl ? (
                                <img src={listing.player.photoUrl} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center">👤</div>}
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase">Target Asset</div>
                            <div className="font-bold text-white text-sm">{listing.player.fullName}</div>
                            <div className="text-xs text-green-400 font-mono">{formatCurrency(listing.player.marketValue)}</div>
                        </div>
                    </div>

                    {/* Offer Player */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Offer Player (Optional)
                        </label>
                        <select
                            className="w-full bg-black border border-white/20 rounded p-2 text-white text-sm focus:border-green-500 outline-none"
                            value={selectedPlayerId}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                        >
                            <option value="">-- Select Player --</option>
                            {userPlayers.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.fullName} ({formatCurrency(p.marketValue)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Offer Credits */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Offer Credits (Optional)
                        </label>
                        <input
                            type="number"
                            className="w-full bg-black border border-white/20 rounded p-2 text-white text-sm focus:border-green-500 outline-none font-mono"
                            placeholder="0"
                            value={credits}
                            onChange={(e) => setCredits(Number(e.target.value))}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Sending..." : "Submit Offer"}
                    </button>
                </div>

                {/* Right: Trade Analytics */}
                <div className="w-full md:w-72 bg-black/40 p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none" />
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xs font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Trade Analytics
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* Incoming Value */}
                        <div className="p-3 bg-green-900/10 border border-green-500/20 rounded">
                            <div className="text-[10px] text-green-500/70 uppercase mb-1">Incoming Value</div>
                            <div className="text-lg font-mono font-bold text-green-400">
                                {formatCurrency(tradeAnalytics.incomingValue)}
                            </div>
                        </div>

                        {/* Outgoing Value */}
                        <div className="p-3 bg-red-900/10 border border-red-500/20 rounded">
                            <div className="text-[10px] text-red-500/70 uppercase mb-1">Outgoing Value</div>
                            <div className="text-lg font-mono font-bold text-red-400">
                                {formatCurrency(tradeAnalytics.outgoingTotal)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                                <span>Asset: {formatCurrency(tradeAnalytics.outgoingPlayerValue)}</span>
                                <span>Cash: {formatCurrency(credits)}</span>
                            </div>
                        </div>

                        {/* Net Value */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">Net Value Delta</div>
                            <div className={`text-2xl font-mono font-black ${tradeAnalytics.netValue > 0 ? "text-green-400" :
                                tradeAnalytics.netValue < 0 ? "text-red-400" : "text-gray-400"
                                }`}>
                                {tradeAnalytics.netValue > 0 ? "+" : ""}
                                {formatCurrency(tradeAnalytics.netValue)}
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className={`mt-auto p-2 text-center border rounded uppercase text-xs font-bold tracking-widest ${tradeAnalytics.status === "WIN" ? "bg-green-500/20 border-green-500 text-green-400" :
                            tradeAnalytics.status === "LOSS" ? "bg-red-500/20 border-red-500 text-red-400" :
                                "bg-gray-500/20 border-gray-500 text-gray-400"
                            }`}>
                            {tradeAnalytics.status === "WIN" && "High Value Trade"}
                            {tradeAnalytics.status === "LOSS" && "Value Deficit"}
                            {tradeAnalytics.status === "FAIR" && "Fair Market Value"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
