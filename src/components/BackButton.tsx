"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
    label?: string;
    href?: string;
}

export default function BackButton({ label = "BASE", href }: BackButtonProps) {
    const router = useRouter();

    const content = (
        <>
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-green-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />

            {/* Content */}
            <div className="relative flex items-center gap-3">
                <ArrowLeft className="w-4 h-4 text-green-500/70 group-hover:text-green-400 transition-colors" />
                <span className="text-xs font-black text-gray-300 group-hover:text-white uppercase tracking-[0.2em]">
                    {label}
                </span>
            </div>

            {/* Tech Deco */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/30 group-hover:border-green-400 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/30 group-hover:border-green-400 transition-colors" />
        </>
    );

    const className = "group relative px-5 py-2 mb-6 overflow-hidden bg-black/40 border border-white/10 hover:border-green-500/50 transition-all duration-300 inline-flex items-center";
    const style = { clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" };

    if (href) {
        return (
            <Link href={href} className={className} style={style}>
                {content}
            </Link>
        );
    }

    return (
        <button
            onClick={() => router.back()}
            className={className}
            style={style}
        >
            {content}
        </button>
    );
}
