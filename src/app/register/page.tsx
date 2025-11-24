"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { registerUser, RegisterState } from "@/lib/auth-actions";

const initialState: RegisterState = {
    error: "",
    success: false,
    message: ""
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerUser, initialState);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isPending) {
                window.dispatchEvent(new Event('cyber-loading-start'));
            } else {
                window.dispatchEvent(new Event('cyber-loading-stop'));
            }
        }
    }, [isPending]);

    return (
        <div className="min-h-screen md:min-h-0 md:h-full md:overflow-y-auto flex items-center justify-center px-4 relative custom-scrollbar">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-neon-cyan transition-colors flex items-center gap-2 group z-30">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="uppercase tracking-widest text-xs font-bold">Back to Home</span>
            </Link>

            <div className="max-w-md w-full bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,243,255,0.15)] relative z-20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Register</h1>
                    <p className="text-slate-400 text-sm uppercase tracking-widest">Join the Trade Center Fantasy world.</p>
                </div>

                <form action={formAction} className="space-y-4">
                    {state?.success && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm text-center">
                            {state.message}
                        </div>
                    )}
                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">First Name</label>
                            <input
                                name="firstName"
                                type="text"
                                required
                                className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                                placeholder="First Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Last Name</label>
                            <input
                                name="lastName"
                                type="text"
                                required
                                className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                            placeholder="Ex: CyberKing23"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                            Only letters, numbers, underscores, and hyphens. No spaces.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Date of Birth</label>
                        <input
                            name="birthDate"
                            type="date"
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors [color-scheme:dark]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-neon-purple hover:bg-purple-500 text-white font-black py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(188,19,254,0.3)] hover:shadow-[0_0_25px_rgba(188,19,254,0.5)] disabled:opacity-50 disabled:cursor-not-allowed mt-6 uppercase tracking-widest"
                    >
                        {isPending ? "Registering..." : "Register"}
                    </button>

                    <div className="text-center text-sm text-slate-400 mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-neon-cyan hover:text-cyan-300 font-bold transition-colors">
                            Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
