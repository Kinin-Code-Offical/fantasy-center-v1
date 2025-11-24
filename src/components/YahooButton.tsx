"use client";

import { signIn } from "next-auth/react";

export default function YahooButton() {
    return (
        <button
            onClick={() => signIn("yahoo", { callbackUrl: "/onboarding" })}
            className="bg-neon-green hover:bg-green-400 text-black font-black text-lg md:text-xl py-4 px-12 rounded-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_40px_rgba(0,255,65,0.6)] hover:scale-105 active:scale-95"
            style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0% 100%)" }}
        >
            SIGN IN WITH YAHOO
        </button>
    );
}
