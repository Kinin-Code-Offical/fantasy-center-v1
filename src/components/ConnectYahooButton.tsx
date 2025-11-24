"use client";

import { signIn } from "next-auth/react";

export default function ConnectYahooButton() {
    return (
        <button
            onClick={() => signIn("yahoo", { callbackUrl: "/" })}
            className="bg-[#6001d2] hover:bg-[#bc13fe] text-white font-bold py-3 px-8 rounded-lg transition-all shadow-[0_0_15px_rgba(96,1,210,0.4)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] uppercase tracking-wide flex items-center gap-3 mx-auto"
        >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
            </svg>
            Connect Yahoo Account
        </button>
    );
}
