"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser } from "@/lib/auth-actions";

const initialState = {
    error: "",
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerUser, initialState);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
            <div className="max-w-md w-full bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,243,255,0.15)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Kayıt Ol</h1>
                    <p className="text-slate-400 text-sm uppercase tracking-widest">Trade Center Fantasy dünyasına katılın.</p>
                </div>

                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm text-center">
                            {state.error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Ad</label>
                            <input
                                name="firstName"
                                type="text"
                                required
                                className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                                placeholder="Adınız"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Soyad</label>
                            <input
                                name="lastName"
                                type="text"
                                required
                                className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                                placeholder="Soyadınız"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Doğum Tarihi</label>
                        <input
                            name="birthDate"
                            type="date"
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors [color-scheme:dark]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">E-posta</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-colors placeholder-slate-600"
                            placeholder="ornek@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Şifre</label>
                        <input
                            name="password"
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
                        {isPending ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
                    </button>

                    <div className="text-center text-sm text-slate-400 mt-4">
                        Zaten hesabınız var mı?{" "}
                        <Link href="/login" className="text-neon-cyan hover:text-cyan-300 font-bold transition-colors">
                            Giriş Yapın
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
