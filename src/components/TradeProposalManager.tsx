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
    const handleOpenTrade = (e: React.MouseEvent<HTMLButtonElement>) => {
        // CRITICAL FIX: Form göndermeyi durdur.
        e.preventDefault();
        e.stopPropagation();

        console.log("%c[BROWSER] 1. Click Event Fired. Preventing default form submission.", "color: #9C27B0; font-weight: bold;");

        // 3. Popup Özellikleri (BOŞLUKSUZ)
        const w = 1024;
        const h = 800;
        const left = window.screen.width / 2 - w / 2;
        const top = window.screen.height / 2 - h / 2;
        // Features string must be strictly adhered to: NO SPACES after commas!
        const features = `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no`;

        // 4. about:blank ile pencereyi anında aç
        // Bu, tarayıcının güvenlik kontrolünü geçmesini sağlar.
        const newWindow = window.open("about:blank", "YahooTradeWindow", features);

        if (!newWindow || newWindow.closed) {
            alert("Popup engellendi! Lütfen bu site için izin verin.");
            return;
        }

        // Yönlendirme yapılana kadar loading ekranı göster.
        newWindow.document.write('<body style="background:#f4f4f4; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;"><h3>Redirecting to Yahoo Fantasy...</h3></body>');


        // 5. URL'i hesapla ve yönlendir
        setTimeout(() => {
            try {
                const tradeUrl = getTradeRedirectUrlLocal(
                    gameCode,
                    leagueKey,
                    sourceTeamKey,
                    targetTeamKey,
                    offeredPlayerKeys,
                    requestedPlayerKeys
                );

                console.log("%c[BROWSER] 2. Popup Yönlendiriliyor:", "color: blue;", tradeUrl);
                newWindow.location.href = tradeUrl;

                popupRef.current = newWindow;
                setStatus('verifying');

            } catch (error) {
                console.error("%c[BROWSER ERROR] URL Hatası:", "color: red;", error);
                newWindow.close();
                setStatus('idle');
                showToast("Trade linki oluşturulamadı", "error");
            }
        }, 100);
    };    // C. Mobile & Background Handling (The "Focus" Trick)
    useEffect(() => {
        if (status !== 'verifying') return;

        const verify = async () => {
            if (!popupRef.current) return;

            if (popupRef.current.closed) {
                console.log("[BROWSER] Popup was closed by user.");
                setStatus('idle');
                return;
            }

            // Call Server Action
            const result = await verifyAndSaveTrade(leagueKey, sourceTeamKey, listingId, offeredPlayerKeys, requestedPlayerKeys);

            if (result.success) {
                console.log("[BROWSER] Trade Verified! Closing popup.");
                popupRef.current.close();
                setStatus('success');
                showToast("Trade Offer Sent Successfully!", "success");
                router.refresh();
                if (onSuccess) onSuccess();
            }
        };

        const timer = setInterval(verify, 2000);
        const onFocus = () => verify();

        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, [status, leagueKey, sourceTeamKey, listingId]); // Add dependencies

    return (
        <button
            type="button"
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

// GITHUB COPILOT INSTRUCTION START

// 1. URL Helper'ı Local olarak tanımla
// NOT: Bu fonksiyon, tarayıcıda senkronize çalışmalı ve manuel string birleştirme yapmalıdır.
function getTradeRedirectUrlLocal(
    sportCode: string,
    leagueKey: string,
    sourceTeamKey: string,
    targetTeamKey: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[]
): string {
    const getIntId = (key: string) => key.split('.').pop() || '';
    const leagueId = leagueKey.split('.')[2];
    const sourceTeamId = getIntId(sourceTeamKey);
    const targetTeamId = getIntId(targetTeamKey);

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

    const baseUrl = `https://${subdomain}.yahoo.com/${sportPath}/${leagueId}/${sourceTeamId}/proposetrade`;

    let queryString = `?stage=1&mid2=${targetTeamId}`;

    // KRİTİK YENİ KURAL UYGULAMASI: TÜM oyuncuları tpids2[] içine al
    const allPlayerKeys = [...offeredPlayerKeys, ...requestedPlayerKeys];

    allPlayerKeys.forEach(key => {
        queryString += `&tpids2[]=${getIntId(key)}`;
    });

    console.log(`%c[BROWSER] FINAL URL (tpids2-only): ${baseUrl + queryString}`, "color: blue; font-weight: bold;");
    return baseUrl + queryString;
}

