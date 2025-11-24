"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Globe, Shield, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface League {
    id: string;
    name: string;
}

interface LeagueFilterSelectorProps {
    userLeagues: League[];
}

export default function LeagueFilterSelector({ userLeagues }: LeagueFilterSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentLeagueId = searchParams.get("leagueId") || "";
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLeague = userLeagues.find(l => l.id === currentLeagueId);
    const label = currentLeague ? currentLeague.name : "ALL MARKETS (GLOBAL)";

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLeagueChange = (leagueId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (leagueId) {
            params.set("leagueId", leagueId);
        } else {
            params.delete("leagueId");
        }
        router.push(`/market?${params.toString()}`);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Holographic Glow Effect */}
            <div className={`absolute inset-0 bg-green-500/20 blur-xl rounded-lg transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} />

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-full md:min-w-[240px] flex items-center justify-between bg-black/80 border rounded-lg overflow-hidden transition-all duration-300 group ${isOpen
                    ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : "border-white/10 hover:border-green-500/50"
                    }`}
            >
                <div className="flex items-center h-full">
                    <div className={`px-3 py-3 border-r transition-colors ${isOpen ? "border-green-500/30 bg-green-500/10" : "border-white/0 bg-white/0"}`}>
                        {currentLeagueId ? (
                            <Shield className={`w-4 h-4 ${isOpen ? "text-green-400" : "text-gray-400"}`} />
                        ) : (
                            <Globe className={`w-4 h-4 ${isOpen ? "text-green-400" : "text-gray-400"}`} />
                        )}
                    </div>
                    <div className="px-4 py-2 text-left">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Target League</div>
                        <div className={`text-xs font-mono font-bold truncate max-w-[160px] ${isOpen ? "text-green-400" : "text-white"}`}>
                            {label}
                        </div>
                    </div>
                </div>
                <div className="pr-3">
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-green-500" : ""}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-black/95 md:bg-black/90 border border-green-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] md:backdrop-blur-md overflow-hidden">
                        {/* Header Decoration */}
                        <div className="h-1 w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {/* Global Option */}
                            <button
                                onClick={() => handleLeagueChange("")}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 group/item ${!currentLeagueId
                                    ? "bg-green-500/10 border border-green-500/30"
                                    : "hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                <div className={`p-1.5 rounded ${!currentLeagueId ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 group-hover/item:text-white"}`}>
                                    <Globe className="w-3 h-3" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className={`text-xs font-bold ${!currentLeagueId ? "text-green-400" : "text-gray-300 group-hover/item:text-white"}`}>
                                        ALL MARKETS
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">Global Database View</div>
                                </div>
                                {!currentLeagueId && <Check className="w-3 h-3 text-green-500" />}
                            </button>

                            {/* Divider */}
                            {userLeagues.length > 0 && (
                                <div className="my-1 border-t border-white/10 mx-2" />
                            )}

                            {/* League Options */}
                            {userLeagues.map((league) => {
                                const isSelected = currentLeagueId === league.id;
                                return (
                                    <button
                                        key={league.id}
                                        onClick={() => handleLeagueChange(league.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 group/item ${isSelected
                                            ? "bg-green-500/10 border border-green-500/30"
                                            : "hover:bg-white/5 border border-transparent"
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded ${isSelected ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 group-hover/item:text-white"}`}>
                                            <Shield className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className={`text-xs font-bold truncate ${isSelected ? "text-green-400" : "text-gray-300 group-hover/item:text-white"}`}>
                                                {league.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono">ID: {league.id.slice(0, 8)}...</div>
                                        </div>
                                        {isSelected && <Check className="w-3 h-3 text-green-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
