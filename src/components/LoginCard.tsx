'use client';

import React from 'react';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface LoginCardProps {
    onOracleClick?: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onOracleClick }) => {
    return (
        <div className="relative z-10 group">
            {/* Glow effect behind */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

            {/* Main Container - Skewed */}
            <div className="relative w-full max-w-lg bg-cyber-dark/80 backdrop-blur-md border border-green-500/30 p-6 md:p-12 transform -skew-x-6 shadow-2xl overflow-hidden mx-4 md:mx-0">

                {/* Background Grid Texture inside card */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* Content - Unskewed to keep text readable */}
                <div className="transform skew-x-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold font-sans text-white mb-2 tracking-tighter uppercase">
                        The Crowd <span className="text-green-400 text-shadow-neon">is Waiting</span>
                    </h1>
                    <p className="text-emerald-200/60 font-mono text-sm md:text-base mb-10 tracking-widest">
                        LINK YOUR YAHOO. DOMINATE YOUR LEAGUE.
                    </p>

                    <div className="flex flex-col space-y-4 items-center">
                        <button
                            onClick={() => signIn('yahoo')}
                            className="w-full max-w-xs bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 uppercase tracking-wider clip-path-slant transition-all transform hover:translate-y-[-2px] shadow-[0_0_20px_rgba(34,197,94,0.4)] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <span>Sign In With Yahoo</span>
                            <ArrowRight size={18} strokeWidth={3} />
                        </button>

                        <div className="flex w-full max-w-xs space-x-4 mt-2">
                            <Link href="/register" className="flex-1">
                                <button className="w-full border border-emerald-700 text-emerald-500 py-2 text-xs uppercase hover:bg-emerald-900/30 transition-colors tracking-widest cursor-pointer">
                                    Create Account
                                </button>
                            </Link>
                            <Link href="/login" className="flex-1">
                                <button className="w-full border border-emerald-700 text-emerald-500 py-2 text-xs uppercase hover:bg-emerald-900/30 transition-colors tracking-widest cursor-pointer">
                                    Login
                                </button>
                            </Link>
                        </div>

                    </div>
                </div>

                {/* Decorative accents on the card */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-green-500/10 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};

export default LoginCard;
