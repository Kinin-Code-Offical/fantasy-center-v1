"use client";

import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen md:min-h-0 md:h-full md:overflow-y-auto flex items-center justify-center px-4 relative custom-scrollbar py-12">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-[#00ff41] transition-colors flex items-center gap-2 group z-30">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="uppercase tracking-widest text-xs font-bold font-mono">Back to Home</span>
            </Link>

            <div className="w-full max-w-md relative z-20">
                <RegisterForm />

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs font-mono">
                        ALREADY HAVE AN ACCOUNT?{" "}
                        <Link href="/login" className="text-[#00ff41] hover:underline tracking-wider">
                            LOGIN_NOW
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
