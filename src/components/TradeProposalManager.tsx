"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { verifyAndSaveTrade } from "@/lib/actions/trade-actions";
import { useToast } from "@/components/ToastProvider";
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";


interface TradeProposalManagerProps {
    leagueKey: string;
    sourceTeamKey: string;
    targetTeamKey: string;
    gameCode: string;
    offeredPlayerKeys: string[];
    requestedPlayerKeys: string[];
    listingId: string;
    offeredCredits: number;
    onSuccess?: () => void;
}

export default function TradeProposalManager({
    leagueKey,
    sourceTeamKey,
    targetTeamKey,
    gameCode,
    offeredPlayerKeys,
    requestedPlayerKeys,
    listingId,
    offeredCredits,
    onSuccess
}: TradeProposalManagerProps) {
    const popupRef = useRef<Window | null>(null);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
    const { showToast } = useToast();
    const router = useRouter();

    // A. Synchronous Open (Critical for avoiding blockers)
    const handleOpenTrade = () => {
        console.log("[Trade Debug] Button Clicked. Starting synchronous flow.");

        try {
            // 1. Calculate URL Synchronously (Client-side only)
            // Do NOT use async server actions here.
            const tradeUrl = getTradeRedirectUrl(
                gameCode,
                leagueKey,
                sourceTeamKey,
                targetTeamKey,
                offeredPlayerKeys,
                requestedPlayerKeys
            );

            // 2. Define Popup Features (NO SPACES allowed in feature string for cross-browser support)
            const width = 1024;
            const height = 800;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;

            // STRICT FORMAT: comma-separated, no spaces
            const features = `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no`;

            console.log("[Trade Debug] Window Features String:", features);

            // 3. Open Window Immediately
            console.log("[Trade Debug] Calling window.open()...");
            // Store reference in a ref
            const newWindow = window.open(tradeUrl, 'YahooTradeWindow', features);

            // 4. Fallback for Blockers
            if (!newWindow) {
                console.error("[Trade Debug] window.open returned null! POPUP BLOCKED.");
                alert("Please allow popups for this site to complete the trade.");
                return;
            }

            if (newWindow.closed) {
                console.error("[Trade Debug] New window is immediately closed?");
                return;
            }

            console.log("[Trade Debug] Window Object:", newWindow);
            console.log(`[Trade Debug] Opened Window Dimensions: ${newWindow.innerWidth}x${newWindow.innerHeight}`);

            popupRef.current = newWindow;

            // Focus attempt
            try {
                newWindow.focus();
                console.log("[Trade Debug] Focus command sent to new window.");
            } catch (e) {
                console.warn("[Trade Debug] Could not focus window:", e);
            }

            // 5. Start Verification State
            setStatus('verifying');

        } catch (error: any) {
            console.error(error);
            showToast(error.message, "error");
        }
    };

    // C. Mobile & Background Handling (The "Focus" Trick)
    useEffect(() => {
        if (status !== 'verifying') return;

        const verifyTrade = async (triggerSource: string) => {
            console.log(`[Trade Debug] Verification triggered via: ${triggerSource}`);

            if (!popupRef.current) {
                console.warn("[Trade Debug] popupRef is null, stopping verification.");
                return;
            }

            // A. Check if user manually closed the popup (Cancellation)
            if (popupRef.current.closed) {
                console.log("[Trade Debug] Detected window closed by user.");
                setStatus('idle');
                // Optional: Show "Trade Cancelled" toast
                return;
            }

            console.log("[Trade Debug] Window is open. Calling Server Action...");

            // B. Check Yahoo API via Server Action
            // This action checks for a pending trade created in the last 3 minutes
            try {
                const response = await verifyAndSaveTrade(
                    leagueKey,
                    sourceTeamKey,
                    listingId,
                    offeredPlayerKeys,
                    requestedPlayerKeys
                );

                console.log("[Trade Debug] Server Action Result:", response);

                if (response.success) {
                    console.log("[Trade Debug] SUCCESS! Closing window & refreshing.");
                    // SUCCESS SEQUENCE
                    setStatus('success');
                    showToast("Trade Successfully Proposed! 🚀", "success");

                    // 1. Close the Yahoo Window
                    popupRef.current.close();

                    // 2. Refresh UI
                    router.refresh();

                    if (onSuccess) onSuccess();
                } else {
                    console.log("[Trade Debug] Trade not found yet on Yahoo.");
                }
            } catch (err) {
                console.error("[Trade Debug] Verification Error:", err);
            }
        };

        // Polling (Desktop) - Check every 2 seconds
        const timer = setInterval(() => verifyTrade('Interval'), 2000);

        // Focus Listener (Mobile) - Check immediately when user returns to tab
        const onFocus = () => {
            console.log("User returned to app, checking trade status...");
            verifyTrade('Focus/Visibility');
        };

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, [status, leagueKey, sourceTeamKey, listingId, offeredPlayerKeys, requestedPlayerKeys, onSuccess, router, showToast]);

    return (
        <button
            onClick={handleOpenTrade}
            disabled={status === 'verifying' || status === 'success'}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${status === 'verifying'
                ? 'bg-yellow-500/20 text-yellow-500 cursor-wait'
                : status === 'success'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
        >
            {status === 'verifying' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-4 h-4" />}
            {status === 'idle' && <ExternalLink className="w-4 h-4" />}

            {status === 'verifying' ? 'Verifying on Yahoo...' :
                status === 'success' ? 'Trade Proposed!' :
                    'Propose on Yahoo'}
        </button>
    );
}

function getTradeRedirectUrl(
    sportCode: string,
    leagueKey: string,
    sourceTeamKey: string,
    targetTeamKey: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[]
) {
    console.log("[Trade Debug] Generating URL...");
    console.log("  - Sport Code:", sportCode);
    console.log("  - League:", leagueKey);
    console.log("  - Source Team:", sourceTeamKey);
    console.log("  - Target Team:", targetTeamKey);
    console.log("  - Offered:", offeredPlayerKeys);
    console.log("  - Requested:", requestedPlayerKeys);

    // 1. Parse IDs
    const getIntId = (key: string) => key.split('.').pop() || '';

    const leagueId = getIntId(leagueKey);
    const sourceTeamId = getIntId(sourceTeamKey);
    const targetTeamId = getIntId(targetTeamKey);

    // 2. Determine Subdomain & Path
    let subdomain = "fantasysports";
    let sportPath = "";

    switch (sportCode.toLowerCase()) {
        case "nfl":
            subdomain = "football.fantasysports";
            sportPath = "f1";
            break;
        case "nba":
            subdomain = "basketball.fantasysports";
            sportPath = "nba";
            break;
        case "mlb":
            subdomain = "baseball.fantasysports";
            sportPath = "b1";
            break;
        case "nhl":
            subdomain = "hockey.fantasysports";
            sportPath = "hockey";
            break;
        default:
            subdomain = `${sportCode}.fantasysports`;
            sportPath = sportCode;
            break;
    }

    // 3. Construct Base URL
    // Example: https://basketball.fantasysports.yahoo.com/nba/12345/1/proposetrade?stage=1&mid2=9
    const baseUrl = `https://${subdomain}.yahoo.com/${sportPath}/${leagueId}/${sourceTeamId}/proposetrade`;

    // 4. Build Query String Manually
    let queryString = `?stage=1&mid2=${targetTeamId}`;

    // Loop through offered players (Source/Team1)
    offeredPlayerKeys.forEach(key => {
        queryString += `&tpids2[]=${getIntId(key)}`;
    });

    // Loop through requested players (Target/Team2)
    requestedPlayerKeys.forEach(key => {
        queryString += `&tpids2[]=${getIntId(key)}`;
    });

    const finalUrl = baseUrl + queryString;
    console.log("[Trade Debug] Final Generated URL:", finalUrl);
    return finalUrl;
}

