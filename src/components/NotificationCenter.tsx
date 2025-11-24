"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCircle, AlertTriangle, Info, MessageSquare } from "lucide-react";
import { getUserNotifications, markAsRead } from "@/lib/actions/notifications";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        const data = await getUserNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, link: string | null) => {
        await markAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (link) {
            setIsOpen(false);
            router.push(link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SYSTEM": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case "TRADE": return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "CLAN": return <MessageSquare className="w-4 h-4 text-blue-500" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-black/90 backdrop-blur-xl border border-green-500/30 rounded-lg shadow-[0_0_30px_rgba(0,255,0,0.1)] z-50 overflow-hidden">
                    <div className="p-3 border-b border-green-500/20 flex justify-between items-center bg-green-900/10">
                        <h3 className="text-xs font-mono font-bold text-green-400 tracking-widest">SYSTEM LOGS // INCOMING</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-mono text-xs">
                                NO NEW LOGS DETECTED
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleMarkAsRead(notification.id, notification.link)}
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${!notification.isRead ? 'bg-green-900/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-bold font-mono ${!notification.isRead ? 'text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-gray-500'}`}>
                                                        {notification.title}
                                                    </span>
                                                    <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap ml-2">
                                                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed ${!notification.isRead ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="shrink-0 self-center">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-green-500/20 bg-black/50 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] text-green-500/70 hover:text-green-400 font-mono uppercase tracking-wider block w-full py-1"
                        >
                            View All Logs
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
