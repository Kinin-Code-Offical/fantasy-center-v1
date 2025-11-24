import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative z-10 text-center max-w-lg">
                <div className="mb-8 relative inline-block">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 tracking-tighter">
                        404
                    </h1>
                    <div className="absolute -inset-1 bg-red-500/20 blur-xl -z-10 animate-pulse" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest">
                    System Error: Page Not Found
                </h2>

                <p className="text-gray-400 mb-8 font-mono">
                    The requested resource could not be located in the database. It may have been deleted, moved, or never existed.
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-all hover:scale-105"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Dashboard
                </Link>
            </div>

            {/* Glitch Effect Overlay (Optional CSS) */}
            <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-5" />
        </div>
    );
}
