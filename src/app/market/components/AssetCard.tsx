import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AssetCardProps {
    player: {
        id: string;
        fullName: string;
        editorialTeam: string | null;
        primaryPos: string | null;
        photoUrl: string | null;
        status: string | null;
        projectedPoints: number;
        fantasyPoints: number;
        percentOwned: number | null;
    };
}

export default function AssetCard({ player }: AssetCardProps) {
    // 1. Calculate Synthetic Price
    const price = (player.projectedPoints * 15000) + (player.fantasyPoints * 5000);
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
        notation: "compact",
        compactDisplay: "short"
    }).format(price);

    // 2. Simulate Trend
    let trendPercent = (Math.random() * 13) - 5; // Range: -5% to +8%

    // Adjust based on status
    if (player.status === "INJ" || player.status === "O") {
        trendPercent = Math.abs(trendPercent) * -1; // Force negative
    } else if (player.status === "Healthy" && player.projectedPoints > 40) {
        trendPercent = Math.abs(trendPercent); // Force positive
    }

    const isPositive = trendPercent >= 0;
    const trendColor = isPositive ? "text-green-400" : "text-red-400";
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="bg-black/80 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-300 group flex flex-col h-full">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10 shrink-0">
                    {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {player.fullName.substring(0, 2)}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-green-400 transition-colors">
                        {player.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase">
                        <span>{player.editorialTeam || "FA"}</span>
                        <span className="text-gray-600">|</span>
                        <span className="text-white">{player.primaryPos}</span>
                    </div>
                </div>
            </div>

            {/* Financials */}
            <div className="p-4 flex-1 flex flex-col justify-center items-center text-center bg-gradient-to-b from-transparent to-white/5">
                <div className="text-3xl font-black text-white tracking-tighter mb-1">
                    {formattedPrice}
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${trendColor} bg-white/5 px-2 py-1 rounded-full`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{Math.abs(trendPercent).toFixed(2)}%</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10 bg-black/40">
                <div className="p-2 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider">F.PTS</div>
                    <div className="text-xs font-bold text-white">{player.fantasyPoints.toFixed(1)}</div>
                </div>
                <div className="p-2 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider">PROJ</div>
                    <div className="text-xs font-bold text-white">{player.projectedPoints.toFixed(1)}</div>
                </div>
                <div className="p-2 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider">OWNED</div>
                    <div className="text-xs font-bold text-white">{player.percentOwned ? `${player.percentOwned}%` : "-"}</div>
                </div>
            </div>

            {/* Action */}
            <Link
                href={`/player/${player.id}`}
                className="block w-full py-3 text-center bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-400 text-xs font-bold uppercase tracking-widest transition-colors border-t border-white/10"
            >
                Inspect Asset
            </Link>
        </div>
    );
}
