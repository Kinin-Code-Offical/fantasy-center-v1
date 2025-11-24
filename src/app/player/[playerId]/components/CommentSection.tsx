"use client";

import { useTransition, useState } from "react";
import { postComment } from "@/lib/actions/social";
import Image from "next/image";

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
        username: string | null;
    };
}

interface CommentSectionProps {
    playerId: string;
    comments: Comment[];
    currentUserImage?: string | null;
}

export default function CommentSection({ playerId, comments, currentUserImage }: CommentSectionProps) {
    const [isPending, startTransition] = useTransition();
    const [content, setContent] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        startTransition(async () => {
            await postComment(playerId, content);
            setContent("");
        });
    };

    return (
        <div className="space-y-6 font-mono">
            {/* Comment Form */}
            <div className="bg-black border border-green-500/30 p-4 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <h3 className="text-green-500 text-xs font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
                    <span className="animate-pulse">_</span> ENCRYPTED_CHANNEL_V.4.0
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-green-500 font-bold">{">"}</span>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="INITIATE TRANSMISSION..."
                            className="w-full bg-black border border-green-500/20 p-3 pl-8 text-sm text-green-400 placeholder-green-900 focus:border-green-500 focus:outline-none focus:shadow-[0_0_10px_rgba(34,197,94,0.2)] transition-all min-h-[80px] resize-y font-mono"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isPending || !content.trim()}
                            className="px-6 py-2 bg-green-900/20 border border-green-500 text-green-500 text-xs font-bold uppercase hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed tracking-widest"
                        >
                            {isPending ? "UPLOADING..." : "EXECUTE_SEND"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-2">
                {comments.map((comment) => (
                    <div key={comment.id} className="p-3 border-l-2 border-green-500/20 hover:border-green-500 hover:bg-green-500/5 transition-all group">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-green-400 font-bold text-xs uppercase">
                                [{comment.user.username || comment.user.name || "UNKNOWN_AGENT"}]:
                            </span>
                            <span className="text-gray-600 text-[10px]" suppressHydrationWarning>
                                {new Date(comment.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed font-mono group-hover:text-green-300 transition-colors">
                            {comment.content}
                        </p>
                    </div>
                ))}
                {comments.length === 0 && (
                    <div className="text-center py-8 text-green-900 text-xs font-mono animate-pulse">
                        NO_SIGNALS_DETECTED... WAITING_FOR_INPUT...
                    </div>
                )}
            </div>
        </div>
    );
}
