"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, AlertTriangle, CheckCircle, Info, AlertOctagon } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // SSR veya Provider dışı kullanımda hata fırlatmak yerine dummy fonksiyon döndür
        // Bu, "Switched to client rendering" hatasını önler.
        return {
            showToast: (message: string, type?: ToastType) => console.log("[Toast Fallback]:", message)
        };
    }
    return context;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-24 right-4 z-[100] flex flex-col gap-4 w-full max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto relative overflow-hidden p-4 rounded border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-full fade-in duration-300 ${toast.type === "success" ? "bg-green-950/80 border-green-500 text-green-400" :
                            toast.type === "error" ? "bg-red-950/80 border-red-500 text-red-400" :
                                toast.type === "warning" ? "bg-yellow-950/80 border-yellow-500 text-yellow-400" :
                                    "bg-blue-950/80 border-blue-500 text-blue-400"
                            }`}
                    >
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none" />

                        {/* Glitch/Tech Deco */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${toast.type === "success" ? "bg-green-500" :
                            toast.type === "error" ? "bg-red-500" :
                                toast.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                            }`} />

                        <div className="flex items-start gap-3 relative z-10">
                            <div className="mt-0.5 shrink-0">
                                {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
                                {toast.type === "error" && <AlertOctagon className="w-5 h-5" />}
                                {toast.type === "warning" && <AlertTriangle className="w-5 h-5" />}
                                {toast.type === "info" && <Info className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">
                                    {toast.type === "success" ? "SYSTEM SUCCESS" :
                                        toast.type === "error" ? "SYSTEM ERROR" :
                                            toast.type === "warning" ? "SYSTEM WARNING" : "SYSTEM NOTICE"}
                                </h4>
                                <p className="text-sm font-mono leading-tight text-white/90">
                                    {toast.message}
                                </p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
