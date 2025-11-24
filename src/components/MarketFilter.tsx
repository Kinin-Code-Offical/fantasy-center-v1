"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import LeagueFilterSelector from "./LeagueFilterSelector";

interface MarketFilterProps {
    userLeagues: { id: string; name: string }[];
}

export default function MarketFilter({ userLeagues }: MarketFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const debouncedSearch = useDebounce(search, 500);
    const [position, setPosition] = useState(searchParams.get("pos") || "ALL");
    const [filter, setFilter] = useState<string | null>(searchParams.get("filter") || null);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set("q", debouncedSearch);
        } else {
            params.delete("q");
        }

        if (position && position !== "ALL") {
            params.set("pos", position);
        } else {
            params.delete("pos");
        }

        if (filter) {
            params.set("filter", filter);
        } else {
            params.delete("filter");
        }

        // Prevent infinite loop by checking if params actually changed
        if (params.toString() !== searchParams.toString()) {
            router.push(`/market?${params.toString()}`);
        }
    }, [debouncedSearch, position, filter, router, searchParams]);

    const positions = ["ALL", "PG", "SG", "SF", "PF", "C"];

    const toggleFilter = (newFilter: string) => {
        if (filter === newFilter) {
            setFilter(null);
        } else {
            setFilter(newFilter);
        }
    };

    return (
        <div className="w-full bg-zinc-900/90 border-y border-white/10 p-4 mb-8 flex flex-col gap-4 relative z-10">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-between">
                {/* Left: Search Input */}
                <div className="relative flex-1 w-full md:min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="SEARCH ASSET ID OR NAME..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none font-mono uppercase placeholder:text-gray-700 transition-all focus:shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Center: League Dropdown */}
                <div className="flex-shrink-0 z-[60]">
                    <LeagueFilterSelector userLeagues={userLeagues} />
                </div>

                {/* Right: My Listings Toggle & Position Filter */}
                <div className="flex flex-wrap items-center gap-4 justify-end">
                    {/* My Listings Toggle (Neon Switch) */}
                    <button
                        onClick={() => toggleFilter('mine')}
                        className={`relative px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300 border ${filter === 'mine'
                            ? 'bg-green-500 border-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]'
                            : 'bg-transparent border-green-500/50 text-white hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:border-green-400'
                            }`}
                    >
                        My Listings
                    </button>

                    {/* Position Filter */}
                    <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-lg p-1">
                        {positions.map((pos) => (
                            <button
                                key={pos}
                                onClick={() => setPosition(pos)}
                                className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${position === pos
                                    ? "bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
