"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRightLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { getPendingOffersCount } from "@/lib/actions/market";
import ServerStatus from "@/components/ServerStatus";

const NotificationCenter = dynamic(() => import("@/components/NotificationCenter"), { ssr: false });

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [pendingOffers, setPendingOffers] = useState(0);

    useEffect(() => {
        if (session?.user) {
            getPendingOffersCount().then(setPendingOffers);
        }
    }, [session, pathname]); // Re-fetch on navigation

    if (pathname?.startsWith('/league') || pathname?.startsWith('/player')) {
        return null;
    }

    return (
        <nav className="border-b border-white/10 bg-[#0a0a12]/95 md:bg-[#0a0a12]/90 md:backdrop-blur-md sticky top-0 z-50 shadow-[0_0_20px_rgba(188,19,254,0.1)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* LOGO & MOBILE MENU TOGGLE */}
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden text-slate-300 hover:text-neon-cyan transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
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

                    {/* RIGHT SIDE */}
                    <div className="flex items-center gap-6">
                        {session ? (
                            // --- IF LOGGED IN ---
                            <div className="flex items-center gap-4 md:gap-6">
                                {/* Navigation Links (Desktop) */}
                                <div className="hidden md:flex items-center gap-6 mr-4">
                                    <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-neon-cyan transition-colors uppercase tracking-wide">
                                        Dashboard
                                    </Link>
                                    <Link href="/market" className="text-sm font-bold text-slate-300 hover:text-neon-cyan transition-colors uppercase tracking-wide">
                                        Market
                                    </Link>
                                    <Link 
                                        href="/trades" 
                                        className={`text-sm font-bold transition-colors uppercase tracking-wide flex items-center gap-2 ${pathname === '/trades' ? 'text-[#00ff41] drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]' : 'text-slate-300 hover:text-neon-cyan'}`}
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        TRADES
                                        {pendingOffers > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-neon-pink rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse">
                                                {pendingOffers}
                                            </span>
                                        )}
                                    </Link>
                                </div>

                                {/* Divider */}
                                <div className="hidden md:block h-8 w-px bg-white/10 mx-2"></div>

                                {/* Utility Zone */}
                                <div className="flex items-center gap-4">
                                    <ServerStatus />
                                    {/* Notification Center */}
                                    <div className="relative z-50">
                                        <NotificationCenter />
                                    </div>

                                    <Link href={`/user/${session.user.username}`} className="flex items-center gap-4 group cursor-pointer">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-bold text-white tracking-wide group-hover:text-neon-cyan transition-colors">
                                                {session.user.username || session.user?.name}
                                            </p>
                                            <p className="text-xs text-neon-cyan font-mono tracking-wider">
                                                {session.user.credits ?? 0} CR
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                                            <Image
                                                src={session.user.avatarUrl || session.user?.image || "/default-avatar.svg"}
                                                alt="Profile"
                                                width={40}
                                                height={40}
                                                className="relative rounded-full border border-white/20 object-cover w-10 h-10 bg-gray-800 p-0.5"
                                            />
                                        </div>
                                    </Link>

                                    <button
                                        onClick={() => signOut()}
                                        className="hidden md:block text-xs text-slate-400 hover:text-neon-pink transition-colors border border-slate-700 hover:border-neon-pink px-3 py-1.5 rounded uppercase tracking-wider font-bold"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // --- IF NOT LOGGED IN ---
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/login"
                                    className="text-sm font-bold text-slate-300 hover:text-neon-cyan transition-colors uppercase tracking-wide"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="relative px-6 py-2 group overflow-hidden rounded-lg bg-transparent"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-neon-purple to-neon-cyan opacity-20 group-hover:opacity-40 transition-opacity"></span>
                                    <span className="absolute inset-0 w-full h-full border border-neon-purple/50 rounded-lg"></span>
                                    <span className="relative text-sm font-bold text-white uppercase tracking-wider group-hover:text-neon-cyan transition-colors">Register</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE MENU OVERLAY */}
            {isMobileMenuOpen && session && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-[#0a0a12]/95 backdrop-blur-md border-b border-white/10 shadow-2xl animate-in slide-in-from-top-5 duration-200 z-40">
                    <div className="flex flex-col p-4 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <Image
                                src={session.user.avatarUrl || session.user?.image || "/default-avatar.svg"}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full border border-white/20"
                            />
                            <div>
                                <p className="text-sm font-bold text-white">{session.user.username || session.user?.name}</p>
                                <p className="text-xs text-neon-cyan font-mono">{session.user.credits ?? 0} CR</p>
                            </div>
                        </div>

                        <Link
                            href="/dashboard"
                            className="p-4 hover:bg-white/5 rounded-lg text-slate-300 hover:text-neon-cyan font-bold uppercase tracking-wide transition-colors flex items-center gap-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/market"
                            className="p-4 hover:bg-white/5 rounded-lg text-slate-300 hover:text-neon-cyan font-bold uppercase tracking-wide transition-colors flex items-center gap-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Market
                        </Link>
                        <Link
                            href="/trades"
                            className="p-4 hover:bg-white/5 rounded-lg text-slate-300 hover:text-neon-cyan font-bold uppercase tracking-wide transition-colors flex items-center gap-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Trades
                            {pendingOffers > 0 && (
                                <span className="ml-auto flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-neon-pink rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                                    {pendingOffers}
                                </span>
                            )}
                        </Link>
                        <Link
                            href={`/user/${session.user.username}`}
                            className="p-4 hover:bg-white/5 rounded-lg text-slate-300 hover:text-neon-cyan font-bold uppercase tracking-wide transition-colors flex items-center gap-3"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            My Profile
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className="p-4 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 font-bold uppercase tracking-wide transition-colors text-left border border-white/5 hover:border-red-500/30"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>

    );
}