"use client";

import { useTransition } from "react";
import { toggleFollowPlayer } from "@/lib/actions/social";

interface FollowButtonProps {
    playerId: string;
    isFollowing: boolean;
}

export default function FollowButton({ playerId, isFollowing }: FollowButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            await toggleFollowPlayer(playerId);
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
            className={`
        relative px-8 py-4 font-black text-xl uppercase tracking-widest transition-all duration-300
        ${isFollowing
                    ? "bg-red-600 text-black hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                    : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.6)]"
                }
        ${isPending ? "opacity-50 cursor-not-allowed grayscale" : ""}
      `}
        >
            <span className="relative z-10 flex items-center gap-2">
                {isPending ? "PROCESSING..." : isFollowing ? "UNFOLLOW TARGET" : "ACQUIRE TARGET"}
            </span>
            {/* Decorative Lines */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-black/50" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-black/50" />
        </button>
    );
}
