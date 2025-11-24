"use client";

import { useEffect, useState } from "react";

interface NewsItem {
    id: string;
    headline: string;
    content: string | null;
    publishedAt: Date;
    source: string | null;
}

interface NewsReaderModalProps {
    newsItem: NewsItem;
    onClose: () => void;
}

export default function NewsReaderModal({ newsItem, onClose }: NewsReaderModalProps) {
    const [displayedContent, setDisplayedContent] = useState("");
    const fullContent = newsItem.content || "NO DATA AVAILABLE";

    // Typing effect
    useEffect(() => {
        setDisplayedContent(""); // Reset on new item
        let i = 0;
        const speed = 5; // ms per char - fast
        const timer = setInterval(() => {
            if (i < fullContent.length) {
                setDisplayedContent((prev) => prev + fullContent.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [fullContent]);

    // Prevent scrolling background
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            {/* The Terminal Window */}
            <div className="max-w-2xl w-full bg-[#0a0a0a] border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)] flex flex-col relative overflow-hidden">
                
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.15),rgba(0,0,0,0.15)_1px,transparent_1px,transparent_2px)] z-0" />
                
                {/* Header Section */}
                <div className="bg-green-900/20 border-b border-green-500/30 p-4 flex justify-between items-center relative z-10">
                    <div className="font-mono text-green-500 text-xs md:text-sm tracking-widest">
                        <span className="animate-pulse mr-2">►</span>
                        INCOMING_TRANSMISSION_ID: #{newsItem.id.slice(0, 8)}
                    </div>
                    <div className="font-mono text-green-500/70 text-xs">
                        {new Date(newsItem.publishedAt).toISOString()}
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh] relative z-10 font-mono custom-scrollbar">
                    <h2 className="text-xl md:text-2xl font-bold text-green-400 uppercase mb-6 tracking-wider leading-relaxed border-l-4 border-green-500 pl-4">
                        {newsItem.headline}
                    </h2>
                    
                    <div className="text-green-400/90 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                        {displayedContent}
                        <span className="animate-pulse inline-block w-2 h-4 bg-green-500 ml-1 align-middle"></span>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="relative z-10">
                    <div className="px-4 py-2 text-[10px] font-mono text-green-500/50 text-right uppercase tracking-widest">
                        ORIGIN: [{newsItem.source || "UNKNOWN_SOURCE"}]
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full bg-red-900/10 hover:bg-red-500 hover:text-black transition-colors border-t border-red-500/50 py-4 font-bold tracking-[0.2em] text-red-500 uppercase font-mono text-sm"
                    >
                        [ TERMINATE CONNECTION ]
                    </button>
                </div>
            </div>
        </div>
    );
}
