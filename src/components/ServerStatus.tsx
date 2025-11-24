"use client";

import { useEffect, useState } from "react";
import { checkSystemStatus } from "@/lib/actions";

export default function ServerStatus() {
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<"ONLINE" | "OFFLINE" | "DEGRADED">("ONLINE");
    const [latency, setLatency] = useState(0);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    useEffect(() => {
        setMounted(true);

        const checkStatus = async () => {
            const start = Date.now();
            try {
                const result = await checkSystemStatus();
                const roundTrip = Date.now() - start;
                // We use the round trip time as the "App Latency"
                setLatency(roundTrip);
                setStatus(result.status as any);
                setLastUpdated(Date.now());
            } catch (e) {
                setStatus("OFFLINE");
            }
        };

        // Initial check
        checkStatus();

        // Poll every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed top-24 right-8 z-50 hidden md:block font-mono text-xs tracking-wider pointer-events-none select-none">
            <div className="flex flex-col items-end gap-1 text-neon-green/80">

                {/* Server Status Line */}
                <div className={`flex items-center gap-2 backdrop-blur-md border px-3 py-1 rounded-sm shadow-[0_0_10px_rgba(0,255,65,0.1)] transition-colors duration-500 ${status === "ONLINE"
                        ? "bg-[#0a120a]/80 border-neon-green/30"
                        : "bg-red-950/80 border-red-500/30"
                    }`}>
                    <span className={status === "ONLINE" ? "text-neon-green/60" : "text-red-400/60"}>SYS.STATUS</span>
                    <span className={`font-bold ${status === "ONLINE" ? "text-white" : "text-red-500"}`}>{status}</span>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${status === "ONLINE"
                            ? "bg-neon-green shadow-[0_0_5px_#00ff41]"
                            : "bg-red-500 shadow-[0_0_5px_#ff0000]"
                        }`}></div>
                </div>

                {/* Connection Info */}
                <div className="flex items-center gap-4 text-[10px] text-neon-green/60 uppercase">
                    <div className="flex items-center gap-1">
                        <span>NODE:</span>
                        <span className="text-neon-green">YAHOO-API-V2</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>LATENCY:</span>
                        <span className={`${latency > 200 ? "text-yellow-500" : "text-neon-green"}`}>{latency}ms</span>
                    </div>
                </div>

                {/* Version Info */}
                <div className="text-[10px] text-neon-green/40">
                    VER: <span className="text-neon-green/60">v1.0.2-BETA</span>
                </div>

            </div>

            {/* Decorative Lines */}
            <div className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-neon-green/50"></div>
            <div className="absolute -left-1 -bottom-1 w-2 h-2 border-b border-l border-neon-green/50"></div>
        </div>
    );
}
