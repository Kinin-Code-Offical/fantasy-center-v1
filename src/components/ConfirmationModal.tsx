"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isProcessing?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isProcessing = false
}: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4">
            <div className="bg-[#0a0a12] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-wide"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase tracking-wide disabled:opacity-50"
                        >
                            {isProcessing ? "Processing..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
