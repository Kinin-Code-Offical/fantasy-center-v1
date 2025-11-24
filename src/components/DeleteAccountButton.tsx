"use client";

import { useState } from "react";
import { deleteAccount } from "@/lib/auth-actions";
import { Trash2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";

export default function DeleteAccountButton() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAccount();
            // Clear cookies and redirect to home
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error("Failed to delete account", error);
            setIsDeleting(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#0a0a12] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in duration-200">
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            This action cannot be undone. All your data, teams, and history will be permanently removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm transition-colors uppercase tracking-wide"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase tracking-wide disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold text-sm uppercase tracking-wider group"
        >
            Delete Account
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
        </button>
    );
}
