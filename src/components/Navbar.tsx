"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl sticky top-0 z-50 shadow-[0_0_20px_rgba(188,19,254,0.1)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* LOGO */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <Image
                                src="/logolong.png"
                                alt="Fantasy Center"
                                width={200}
                                height={50}
                                className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
                                priority
                            />
                        </Link>
                    </div>

                    {/* SAĞ TARAF */}
                    <div className="flex items-center gap-6">
                        {session ? (
                            // --- GİRİŞ YAPILDIYSA ---
                            <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-white tracking-wide">{session.user?.name}</p>
                                    <p className="text-xs text-neon-cyan font-mono tracking-wider">1000 CR</p>
                                </div>

                                {session.user?.image && (
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                                        <Image
                                            src={session.user.image}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="relative rounded-full border border-white/20"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={() => signOut()}
                                    className="text-xs text-slate-400 hover:text-neon-pink transition-colors border border-slate-700 hover:border-neon-pink px-3 py-1.5 rounded uppercase tracking-wider font-bold"
                                >
                                    Çıkış
                                </button>
                            </div>
                        ) : (
                            // --- GİRİŞ YAPILMADIYSA ---
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-bold text-slate-300 hover:text-neon-cyan transition-colors uppercase tracking-wide"
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    href="/register"
                                    className="relative px-6 py-2 group overflow-hidden rounded-lg bg-transparent"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-neon-purple to-neon-cyan opacity-20 group-hover:opacity-40 transition-opacity"></span>
                                    <span className="absolute inset-0 w-full h-full border border-neon-purple/50 rounded-lg"></span>
                                    <span className="relative text-sm font-bold text-white uppercase tracking-wider group-hover:text-neon-cyan transition-colors">Kayıt Ol</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}