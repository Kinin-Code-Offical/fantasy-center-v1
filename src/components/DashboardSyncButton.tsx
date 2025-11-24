"use client";

import { useState } from "react";
import { syncUserLeagues } from "@/lib/actions/sync";
import { useRouter } from "next/navigation";

interface DashboardSyncButtonProps {
    variant?: "default" | "large";
}

export default function DashboardSyncButton({ variant = "default" }: DashboardSyncButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        try {
            await syncUserLeagues();
            router.refresh();
        } catch (error) {
            console.error("Sync failed", error);
            alert("Sync failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    if (variant === "large") {
        return (
            <button
                onClick={handleSync}
                disabled={loading}
                className="group relative px-8 py-4 bg-black border border-green-500/50 text-green-400 rounded-xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:border-green-400"
            >
                <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center gap-3 text-lg font-bold tracking-widest uppercase">
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                            Syncing Data...
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Initialize Data Sync
                        </>
                    )}
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className="px-4 py-2 bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 font-mono text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
            {loading ? (
                <>
                    <div className="w-3 h-3 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    Syncing...
                </>
            ) : (
                "Sync Yahoo"
            )}
        </button>
    );
}
