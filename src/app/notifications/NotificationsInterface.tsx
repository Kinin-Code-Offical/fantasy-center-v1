"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllAsRead, deleteAllNotifications, markAsRead } from "@/lib/actions/notifications";
import { AlertTriangle, CheckCircle, MessageSquare, Info, Trash2, CheckCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
}

interface Props {
    initialNotifications: Notification[];
    username: string;
}

export default function NotificationsInterface({ initialNotifications, username }: Props) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const router = useRouter();

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        router.refresh();
    };

    const handleClearAllClick = () => {
        setShowConfirm(true);
    };

    const confirmClearAll = async () => {
        setIsClearing(true);
        try {
            await deleteAllNotifications();
            setNotifications([]);
            router.refresh();
            setShowConfirm(false);
        } catch (error) {
            console.error("Failed to clear notifications", error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleMarkOneRead = async (id: string, link: string | null) => {
        if (!link) {
            // If no link, just toggle read status locally and on server
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            router.refresh();
        } else {
            // If link, let the server action handle it (it revalidates) and navigate
            await markAsRead(id);
            router.push(link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SYSTEM": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case "TRADE": return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "CLAN": return <MessageSquare className="w-5 h-5 text-blue-500" />;
            default: return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 pb-20 font-mono relative z-10">
            {/* Modal */}
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmClearAll}
                title="Clear History?"
                message="This action cannot be undone. All your system logs and notifications will be permanently removed."
                confirmText="Yes, Clear All"
                isProcessing={isClearing}
            />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 mb-4 transition-colors text-xs uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4" /> Return to Home
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.3)]">
                            System Log Archive
                        </h1>
                        <p className="text-xs text-green-500/60 tracking-widest uppercase mt-1">
                            // USER: {username} // TOTAL LOGS: {notifications.length}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300 rounded transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <CheckCheck className="w-4 h-4" /> Mark All Read
                        </button>
                        <button
                            onClick={handleClearAllClick}
                            className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Trash2 className="w-4 h-4" /> Clear History
                        </button>
                    </div>
                </div>

                {/* Console Container */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                    {/* Console Header */}
                    <div className="bg-white/5 border-b border-white/10 p-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <div className="ml-4 text-xs text-gray-500 font-mono">/var/log/syslog/user_{username.toLowerCase().replace(/\s+/g, '_')}</div>
                    </div>

                    {/* Log List */}
                    <div className="flex-1 overflow-y-auto p-0">
                        {notifications.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 p-12">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-800 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-gray-800" />
                                </div>
                                <div className="text-xl font-bold uppercase tracking-widest">No Signal Detected</div>
                                <p className="text-sm font-mono">System logs are empty. Waiting for incoming transmission...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-xs uppercase text-gray-500 font-mono sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="p-4 border-b border-white/10 w-48">Timestamp</th>
                                        <th className="p-4 border-b border-white/10 w-24">Type</th>
                                        <th className="p-4 border-b border-white/10">Message</th>
                                        <th className="p-4 border-b border-white/10 w-32 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {notifications.map((log) => (
                                        <tr
                                            key={log.id}
                                            onClick={() => handleMarkOneRead(log.id, log.link)}
                                            className={`group hover:bg-white/5 transition-colors cursor-pointer ${!log.isRead ? 'bg-green-900/5' : ''}`}
                                        >
                                            <td className="p-4 font-mono text-xs text-gray-400 group-hover:text-green-400 transition-colors">
                                                {new Date(log.createdAt).toLocaleString('en-US', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                                                    hour12: false
                                                })}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {getIcon(log.type)}
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${log.type === 'SYSTEM' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        log.type === 'TRADE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                            log.type === 'CLAN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                        }`}>
                                                        {log.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`font-bold text-sm mb-1 ${!log.isRead ? 'text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'text-gray-400'}`}>
                                                    {log.title}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    {log.message}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {!log.isRead ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 animate-pulse">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                                                        UNREAD
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-600 font-mono">READ</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
