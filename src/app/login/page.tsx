"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleYahooLogin = () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cyber-loading-start'));
        }
        signIn("yahoo", { callbackUrl: "/" });
    };

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cyber-loading-start'));
        }

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password");
                setLoading(false);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('cyber-loading-stop'));
                }
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError("An error occurred");
            setLoading(false);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('cyber-loading-stop'));
            }
        }
    };

    return (
        <div className="min-h-screen md:min-h-0 md:h-full md:overflow-y-auto flex items-center justify-center px-4 relative custom-scrollbar">
            {/* Back Button */}
            <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-neon-cyan transition-colors flex items-center gap-2 group z-30">
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="uppercase tracking-widest text-xs font-bold">Back to Home</span>
            </Link>

            <div className="max-w-md w-full space-y-8 bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(188,19,254,0.15)] relative z-20">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-white tracking-tight">LOGIN</h2>
                    <p className="mt-2 text-slate-400 text-sm uppercase tracking-widest">To access your account</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-colors placeholder-slate-600"
                            placeholder="example@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-[#030014] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-colors placeholder-slate-600"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-neon-purple hover:bg-purple-500 text-white font-black py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(188,19,254,0.3)] hover:shadow-[0_0_25px_rgba(188,19,254,0.5)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#0a0a12] text-slate-500">Or continue with</span>
                    </div>
                </div>

                {/* YAHOO LOGIN BUTTON */}
                <button
                    onClick={handleYahooLogin}
                    className="w-full flex items-center justify-center gap-3 bg-[#6001d2] hover:bg-[#bc13fe] text-white px-4 py-3 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(96,1,210,0.4)] hover:shadow-[0_0_25px_rgba(188,19,254,0.6)] uppercase tracking-wide"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 7h-2v-6h2v6zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                    </svg>
                    Login with Yahoo
                </button>

                <div className="text-center text-sm text-slate-400">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-neon-purple hover:text-neon-pink font-bold transition-colors">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}