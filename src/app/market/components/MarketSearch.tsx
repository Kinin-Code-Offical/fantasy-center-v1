"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export default function MarketSearch() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        params.set("page", "1"); // Reset to page 1
        replace(`/market?${params.toString()}`);
    }, 300);

    const handleFilter = (pos: string) => {
        const params = new URLSearchParams(searchParams);
        if (pos === "ALL") {
            params.delete("pos");
        } else {
            params.set("pos", pos);
        }
        params.set("page", "1");
        replace(`/market?${params.toString()}`);
    };

    const currentPos = searchParams.get("pos") || "ALL";

    return (
        <div className="space-y-6 mb-8">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-black rounded-lg border border-white/10">
                    <Search className="w-6 h-6 text-gray-400 ml-4" />
                    <input
                        type="text"
                        placeholder="SEARCH NAME, TEAM, TICKER..."
                        className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 py-4 px-4 text-lg font-mono uppercase tracking-wider focus:outline-none"
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get("q")?.toString()}
                    />
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
                {["ALL", "PG", "SG", "SF", "PF", "C"].map((pos) => (
                    <button
                        key={pos}
                        onClick={() => handleFilter(pos)}
                        className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all border ${currentPos === pos
                                ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                            }`}
                    >
                        {pos}
                    </button>
                ))}
            </div>
        </div>
    );
}
