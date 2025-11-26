"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { verifyTradeStatus } from "@/lib/actions/trade-actions";
import { useToast } from "@/components/ToastProvider";
import { getTradeDetailUrl } from "@/lib/trade-url-helper";

interface TradeActionManagerProps {
    leagueKey: string;
    gameCode: string;
    transactionId: string; // Yahoo Transaction Key
    teamId?: string; // User's Team ID in this league
    action: 'accept' | 'reject' | 'cancel';
    onSuccess?: () => void;
    children: (runAction: () => void, isLoading: boolean) => React.ReactNode;
}

export default function TradeActionManager({
    leagueKey,
    gameCode,
    transactionId,
    teamId,
    action,
    onSuccess,
    children
}: TradeActionManagerProps) {
    const popupRef = useRef<Window | null>(null);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
    const { showToast } = useToast();
    const router = useRouter();

    const handleAction = () => {
        // 1. Open Popup
        const w = 1024;
        const h = 800;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        const features = `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes,status=yes`;

        const url = getTradeDetailUrl(gameCode, leagueKey, transactionId, teamId);

        const newWindow = window.open(url, "YahooTradeAction", features);

        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            showToast("Popup blocked! Please allow popups.", "error");
            return;
        }

        popupRef.current = newWindow;
        setStatus('verifying');
        showToast(`Please ${action} the trade in the popup window.`, "info");
    };

    // 2. Verify Loop
    useEffect(() => {
        if (status !== 'verifying') return;

        const verify = async () => {
            if (popupRef.current && popupRef.current.closed) {
                setStatus('idle');
                return;
            }

            try {
                const expectedStatus = action === 'accept' ? 'accepted' :
                    action === 'reject' ? 'rejected' : 'cancelled';

                const res = await verifyTradeStatus(leagueKey, transactionId, expectedStatus);

                if (res.success) {
                    if (popupRef.current) popupRef.current.close();
                    setStatus('success');
                    showToast(`Trade ${action}ed successfully!`, "success");
                    router.refresh();
                    if (onSuccess) onSuccess();
                }
            } catch (e) {
                console.error("Verification error", e);
            }
        };

        const timer = setInterval(verify, 3000);
        return () => clearInterval(timer);
    }, [status, leagueKey, transactionId, action, onSuccess, router, showToast]);

    return <>{children(handleAction, status === 'verifying')}</>;
}
