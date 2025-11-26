"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    let errorMessage = "An unknown error occurred.";
    let errorDescription = "Please try again later.";

    if (error === "Callback") {
        errorMessage = "Authentication Error";
        errorDescription = "There was a problem with the authentication callback. This usually happens when you cancel the login process or if the provider is experiencing issues.";
    } else if (error === "OAuthAccountNotLinked") {
        errorMessage = "Account Not Linked";
        errorDescription = "To confirm your identity, sign in with the same account you used originally.";
    } else if (error === "AccessDenied") {
        errorMessage = "Access Denied";
        errorDescription = "You do not have permission to sign in.";
    } else if (error === "Verification") {
        errorMessage = "Verification Failed";
        errorDescription = "The verification link was invalid or has expired.";
    }

    return (
        <div className="w-full h-full overflow-y-auto flex items-center justify-center px-4 relative custom-scrollbar">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-neon-cyan transition-colors flex items-center gap-2 group z-30">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="uppercase tracking-widest text-xs font-bold">Back to Home</span>
            </Link>

            <div className="max-w-md w-full bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-xl border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative z-20">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/50 mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">{errorMessage}</h1>
                    <p className="text-slate-400 text-sm">{errorDescription}</p>
                </div>

                <div className="space-y-4">
                    <Link href="/login" className="block w-full">
                        <button className="w-full bg-neon-cyan hover:bg-cyan-400 text-black font-black py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] uppercase tracking-widest">
                            Try Again
                        </button>
                    </Link>

                    <Link href="/" className="block w-full">
                        <button className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-white font-bold py-3 px-4 rounded-lg transition-all uppercase tracking-widest text-sm">
                            Return Home
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
