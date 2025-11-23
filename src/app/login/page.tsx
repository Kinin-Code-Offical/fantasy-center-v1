"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            setError("Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
            <div className="max-w-md w-full space-y-8 bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(188,19,254,0.15)]">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white tracking-tight">GİRİŞ YAP</h2>
                    <p className="mt-2 text-slate-400 text-sm uppercase tracking-widest">Hesabınıza erişmek için</p>
                </div>

                {/* YAHOO LOGIN BUTTON */}
                <button
                    onClick={() => signIn("yahoo", { callbackUrl: "/" })}
                    className="w-full flex items-center justify-center gap-3 bg-[#6001d2] hover:bg-[#bc13fe] text-white px-4 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(96,1,210,0.4)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] uppercase tracking-wide"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                    </svg>
                    Yahoo ile Giriş Yap
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#0a0a12] text-slate-500 uppercase text-xs tracking-widest">veya e-posta ile</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            E-posta Adresi
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#030014] border border-white/10 rounded-lg focus:ring-2 focus:ring-neon-cyan focus:border-transparent text-white placeholder-slate-600 transition-all"
                            placeholder="ornek@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            Şifre
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#030014] border border-white/10 rounded-lg focus:ring-2 focus:ring-neon-cyan focus:border-transparent text-white placeholder-slate-600 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-neon-cyan hover:bg-cyan-400 text-black font-black py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                    </button>
                </form>

                <div className="text-center text-sm text-slate-400">
                    Hesabınız yok mu?{" "}
                    <Link href="/register" className="text-neon-purple hover:text-neon-pink font-bold transition-colors">
                        Kayıt Olun
                    </Link>
                </div>
            </div>
        </div>
    );
}
