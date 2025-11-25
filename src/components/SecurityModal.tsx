"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X, Terminal } from "lucide-react";

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
    securityCode: string;
    onConfirm: () => void;
    isLoading?: boolean;
}

export default function SecurityModal({
    isOpen,
    onClose,
    securityCode,
    onConfirm,
    isLoading = false,
}: SecurityModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop with scanline effect */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
            </div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg mx-4 bg-[#0a0a12] border-2 border-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.3)] overflow-hidden transform transition-all duration-300 scale-100">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ff41]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ff41]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ff41]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ff41]" />

                {/* Header */}
                <div className="bg-[#00ff41]/10 border-b border-[#00ff41] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#00ff41]">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        <h3 className="font-mono font-bold tracking-widest text-sm">
                            SECURITY PROTOCOL INITIATED<span className="animate-pulse">_</span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-[#00ff41] hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="text-center space-y-4">
                        <p className="text-slate-400 font-mono text-sm leading-relaxed">
                            SENSITIVE DATA MODIFICATION DETECTED.
                            <br />
                            INITIATING TWO-FACTOR HANDSHAKE.
                        </p>

                        {/* Security Code Box */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff41] to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative bg-black border border-[#00ff41] p-6 rounded-lg">
                                <p className="text-xs text-slate-500 font-mono mb-2 uppercase tracking-widest">Session Security ID</p>
                                <div className="text-4xl font-black font-mono text-[#00ff41] tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
                                    {securityCode}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 text-left bg-[#00ff41]/5 p-4 rounded border border-[#00ff41]/20">
                            <Terminal className="w-5 h-5 text-[#00ff41] mt-1 shrink-0" />
                            <p className="text-xs text-slate-300 font-mono">
                                A verification link has been sent to your email.
                                <span className="text-[#00ff41] font-bold block mt-1">
                                    CONFIRM that the code in the email matches the code above to avoid phishing attacks.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-slate-700 text-slate-400 font-mono text-sm hover:bg-slate-800 hover:text-white transition-colors uppercase tracking-wider"
                        >
                            Abort
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-[#00ff41] text-black font-bold font-mono text-sm hover:bg-[#00cc33] transition-colors uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,65,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm & Send"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
