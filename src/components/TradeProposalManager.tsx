"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { verifyAndSaveTrade } from "@/lib/actions/trade-actions";
import { useToast } from "@/components/ToastProvider";
import { Loader2, ExternalLink, CheckCircle, ArrowRight } from "lucide-react";

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

// TARAYICIDA ÇALIŞAN URL OLUŞTURUCU (Local Helper)
function getTradeRedirectUrlLocal(
    sportCode: string,
    leagueKey: string,
    sourceTeamKey: string,
    targetTeamKey: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[]
): string {
    // Güvenlik Kontrolü
    if (!leagueKey || !sourceTeamKey || !targetTeamKey) {
        console.error("https://www.merriam-webster.com/dictionary/error Eksik Anahtarlar:", { leagueKey, sourceTeamKey, targetTeamKey });
        throw new Error("Takım bilgileri eksik. Lütfen sayfayı yenileyin.");
    }

    const getIntId = (key: string) => {
        if (!key) return '';
        return key.split('.').pop() || '';
    };

    const leagueId = leagueKey.split('.')[2];
    const sourceTeamId = getIntId(sourceTeamKey);
    const targetTeamId = getIntId(targetTeamKey);

    let subdomain = "basketball.fantasysports";
    let sportPath = "nba";

    if (sportCode === 'nfl' || leagueKey.includes('football')) {
        subdomain = "football.fantasysports";
        sportPath = "f1";
    }

    const baseUrl = `https://${subdomain}.yahoo.com/${sportPath}/${leagueId}/${sourceTeamId}/proposetrade`;

    // YAHOO KURALI: Tüm oyuncular (senin ve onun) tpids2 parametresine eklenir.
    let queryString = `?stage=1&mid2=${targetTeamId}`;
    const allPlayers = [...(offeredPlayerKeys || []), ...(requestedPlayerKeys || [])];

    allPlayers.forEach(key => {
        if (key) queryString += `&tpids2[]=${getIntId(key)}`;
    });

    return baseUrl + queryString;
}

export default function TradeProposalManager(props: TradeProposalManagerProps) {
    const popupRef = useRef<Window | null>(null);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
    const [isPopupBlocked, setIsPopupBlocked] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    // Mobile Persistence: Check for pending verification on mount
    useEffect(() => {
        const storageKey = `pending_trade_${props.listingId}`;
        const savedState = localStorage.getItem(storageKey);

        if (savedState) {
            const { timestamp } = JSON.parse(savedState);
            // If less than 10 minutes old, resume verification
            if (Date.now() - timestamp < 10 * 60 * 1000) {
                console.log("[MOBILE] Resuming verification from localStorage");
                setStatus('verifying');
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    }, [props.listingId]);

    const handleOpenTrade = (e: React.MouseEvent<HTMLButtonElement>) => {
        // 1. SAYFA YENİLENMESİNİ DURDUR (KRİTİK)
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();

        console.log("[BROWSER] Butona tıklandı. Popup açılıyor...");

        // Reset blocked state
        setIsPopupBlocked(false);

        // Save state for mobile refresh
        localStorage.setItem(`pending_trade_${props.listingId}`, JSON.stringify({
            timestamp: Date.now(),
            status: 'verifying'
        }));

        // 2. BOŞ POPUP AÇ
        const w = 1024;
        const h = 800;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        const features = `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes,status=yes`;

        const newWindow = window.open("about:blank", "YahooTradeWindow", features);

        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            console.warn("[BROWSER] Popup blocked by browser.");
            setIsPopupBlocked(true);
            showToast("Popup Engellendi! Lütfen izin verin.", "error");
            return;
        }

        popupRef.current = newWindow;
        setStatus('verifying');

        // Kullanıcıya bilgi ver (Riskli DOM işlemi kaldırıldı)
        // Cross-origin hatalarını önlemek için document.write kullanmıyoruz.

        // 3. URL OLUŞTUR VE YÖNLENDİR
        setTimeout(() => {
            try {
                const url = getTradeRedirectUrlLocal(
                    props.gameCode,
                    props.leagueKey,
                    props.sourceTeamKey,
                    props.targetTeamKey,
                    props.offeredPlayerKeys,
                    props.requestedPlayerKeys
                );

                console.log("[BROWSER] Yönlendiriliyor:", url);
                if (newWindow && !newWindow.closed) {
                    newWindow.location.href = url;
                    newWindow.focus();
                }
            } catch (err: any) {
                console.error("[BROWSER ERROR]", err);
                newWindow.close();
                setStatus('idle');
                showToast("URL Hatası: " + err.message, "error");
            }
        }, 500); // Yarım saniye bekle ki tarayıcı popup'ı tamamen oluştursun
    };

    // 4. DOĞRULAMA DÖNGÜSÜ
    useEffect(() => {
        if (status !== 'verifying') return;

        const verify = async () => {
            // Mobile Check: If popupRef is null (page refreshed), we can't check .closed
            // But we should still try to verify with the server.
            // Only stop if we explicitly know it's closed AND we have a ref.
            if (popupRef.current && popupRef.current.closed) {
                if (status === 'verifying') {
                    showToast("İşlem penceresi kapatıldı.", "info");
                    localStorage.removeItem(`pending_trade_${props.listingId}`);
                }
                setStatus('idle');
                return;
            }

            try {
                // Server Action ile kontrol et
                const res = await verifyAndSaveTrade(
                    props.leagueKey,
                    props.sourceTeamKey, // Burası artık 'teamKey' olarak gidecek
                    props.listingId,
                    props.offeredPlayerKeys,
                    props.requestedPlayerKeys
                );

                if (res.success) {
                    console.log("[BROWSER] İşlem Başarılı!");
                    if (popupRef.current) popupRef.current.close();

                    setStatus('success');
                    localStorage.removeItem(`pending_trade_${props.listingId}`);

                    router.refresh();
                    if (props.onSuccess) props.onSuccess();
                }
            } catch (e) {
                console.error("Doğrulama hatası", e);
            }
        };

        const timer = setInterval(verify, 3000);

        // Mobilde sekme değişimi için listener
        const onFocus = () => verify();
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, [status, props]);

    return (
        <div className="flex flex-col gap-2 w-full">
            <button
                type="button" // <--- BU, FORM SUBMIT'İ ENGELLER
                onClick={handleOpenTrade}
                disabled={status === 'verifying' || status === 'success'}
                className={`w-full py-5 ${isPopupBlocked ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-500'} text-black font-black uppercase tracking-[0.2em] text-lg clip-path-button relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300`}
                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
            >
                <span className="relative z-10 flex items-center justify-center gap-3">
                    {isPopupBlocked ? (
                        <>
                            <ExternalLink className="w-5 h-5" />
                            ⚠️ İZİN VERİP TEKRAR DENE
                        </>
                    ) : status === 'verifying' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            YAHOO BEKLENİYOR...
                        </>
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            TEKLİF GÖNDERİLDİ
                        </>
                    ) : (
                        <>
                            SUBMIT TRADE OFFER
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </span>
            </button>

            {/* Permission Instruction Helper */}
            {isPopupBlocked && (
                <div className="text-xs text-red-400 text-center p-3 bg-red-900/20 border border-red-500/30 rounded animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold mb-1">POPUP ENGELLENDİ</p>
                    <p>Lütfen tarayıcınızın adres çubuğundaki (🔒 veya 🚫) ikonuna tıklayarak <strong>"Popuplara İzin Ver"</strong> seçeneğini işaretleyin ve butona tekrar basın.</p>
                </div>
            )}
        </div>
    );
}