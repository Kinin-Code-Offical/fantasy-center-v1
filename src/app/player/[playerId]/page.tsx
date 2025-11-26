import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import FollowButton from "./components/FollowButton";
import CommentSection from "./components/CommentSection";
import Navbar from "@/components/Navbar";

export default async function PlayerPage({ params, searchParams }: { params: Promise<{ playerId: string }>, searchParams: Promise<{ leagueId?: string, from?: string }> }) {
    const { playerId } = await params;
    const { leagueId, from } = await searchParams;
    const session = await getServerSession(authOptions);

    // Determine Back Link
    let backLink = "/dashboard";
    let backLabel = "RETURN TO SECTOR";

    if (from === "market") {
        backLink = "/market";
        backLabel = "RETURN TO MARKET";
    } else if (leagueId) {
        backLink = `/league/${leagueId}`;
        backLabel = "RETURN TO LEAGUE";
    }

    // Fetch Player
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: {
            comments: {
                include: {
                    user: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            followers: {
                where: {
                    user: {
                        email: session?.user?.email || "",
                    },
                },
            },
        },
    });

    if (!player) {
        notFound();
    }

    const isFollowing = player.followers.length > 0;

    // Helper to format stats safely
    const stats = player.stats as Record<string, any> || {};

    return (
        <div className="w-full h-auto md:h-full md:overflow-y-auto bg-[#050505] text-white font-mono selection:bg-green-500/30 pt-8 pb-20 relative custom-scrollbar">
            <Navbar />

            {/* Background Grid & Effects */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#00ff0005_1px,transparent_1px),linear-gradient(to_bottom,#00ff0005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-green-900/10 to-transparent pointer-events-none" />

            <main className="container mx-auto px-4 max-w-7xl relative z-10 min-h-full">
                {/* Back Button */}
                <div className="mb-8">
                    <Link href={backLink} className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors uppercase tracking-widest text-xs font-bold group">
                        <span className="group-hover:-translate-x-1 transition-transform">{"<-"}</span>
                        {backLabel}
                    </Link>
                </div>

                {/* Header / Asset Card */}
                <div className="relative bg-black/80 border border-green-500/30 p-8 mb-8 overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(0,255,0,0.05)]">
                    {/* Decorative Corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                        {/* Player Photo - Hexagon */}
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative w-48 h-48 md:w-56 md:h-56 bg-black" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                <Image
                                    src={player.photoUrl || "/default-avatar.svg"}
                                    alt={player.fullName}
                                    fill
                                    sizes="(max-width: 768px) 192px, 224px"
                                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                {/* Scanline Overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none" />
                            </div>

                            {/* Spinning Ring */}
                            <div className="absolute -inset-4 border border-green-500/30 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none border-dashed" />
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 w-full text-center md:text-left">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]" style={{ textShadow: "0 0 20px rgba(0,255,0,0.3)" }}>
                                {player.fullName}
                            </h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-green-400 mb-8 font-mono text-sm">
                                <span className="px-2 py-1 bg-green-900/20 border border-green-500/30">
                                    [UNIT: {player.editorialTeam || "FA"}]
                                </span>
                                <span className="px-2 py-1 bg-green-900/20 border border-green-500/30">
                                    [CLASS: {player.primaryPos || "UTIL"}]
                                </span>
                                <span className={`px-2 py-1 border ${player.status === 'Healthy' || !player.status ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                                    [STATUS: {player.status || 'OPERATIONAL'}]
                                </span>
                            </div>

                            {/* Power Level Bars */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-2xl">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-widest text-green-500">
                                        <span>Fantasy Output</span>
                                        <span>{player.fantasyPoints.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 w-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                                            style={{ width: `${Math.min((player.fantasyPoints / 60) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-widest text-cyan-500">
                                        <span>Projected Output</span>
                                        <span>{player.projectedPoints.toFixed(1)}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 w-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                            style={{ width: `${Math.min((player.projectedPoints / 60) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <FollowButton playerId={player.id} isFollowing={isFollowing} />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Community Feed */}
                    <div className="lg:col-span-2">
                        <div className="bg-black/80 border border-green-500/20 p-6 min-h-[500px] relative">
                            <div className="absolute top-0 left-0 w-2 h-2 bg-green-500" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-green-500" />

                            <div className="flex items-center justify-between mb-8 border-b border-green-500/20 pb-4">
                                <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 tracking-widest">
                                    <span className="w-2 h-2 bg-green-500 animate-pulse" />
                                    ENCRYPTED COMMS
                                </h2>
                                <span className="text-xs text-green-700 font-mono">
                                    // {player.comments.length} SIGNALS
                                </span>
                            </div>

                            <CommentSection
                                playerId={player.id}
                                comments={player.comments}
                                currentUserImage={session?.user?.image}
                            />
                        </div>
                    </div>

                    {/* Right: Intel / Charts Placeholder */}
                    <div className="lg:col-span-1">
                        <div className="bg-black/80 border border-green-500/20 p-6 h-full relative overflow-hidden">
                            {/* Background Decorations */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <svg width="100%" height="100%">
                                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                    </pattern>
                                    <rect width="100%" height="100%" fill="url(#grid)" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 mb-6 tracking-widest relative z-10">
                                <span className="w-2 h-2 bg-green-500" />
                                PERFORMANCE MATRIX
                            </h2>

                            {/* A. Primary Stat Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                                {[
                                    { label: "PTS", value: stats.pts },
                                    { label: "REB", value: stats.reb },
                                    { label: "AST", value: stats.ast },
                                    { label: "ST", value: stats.st },
                                    { label: "BLK", value: stats.blk },
                                    { label: "TO", value: stats.to },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/5 border border-white/10 p-2 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group">
                                        <span className="text-[10px] text-green-500 font-bold mb-1 group-hover:text-green-400">{stat.label}</span>
                                        <span className="text-xl md:text-2xl font-mono text-white font-bold tracking-tighter">
                                            {stat.value || "-"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* B. Market Intel */}
                            <div className="space-y-6 mb-8 relative z-10">
                                <div>
                                    <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-widest">
                                        <span>Market Saturation (% Rostered)</span>
                                        <span className="text-white">{(player as any).percentOwned || 0}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 w-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                            style={{ width: `${(player as any).percentOwned || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-widest">
                                        <span>Deployment Rate (% Started)</span>
                                        <span className="text-white">{(player as any).percentStarted || 0}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 w-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                            style={{ width: `${(player as any).percentStarted || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* C. Trend Summary */}
                            <div className="bg-green-900/10 border border-green-500/20 p-4 relative z-10">
                                <div className="text-[10px] text-green-600 font-mono mb-1 uppercase">Performance Delta</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">
                                        {((player as any).fantasyPoints - (player as any).projectedPoints) > 0 ? "+" : ""}
                                        {((player as any).fantasyPoints - (player as any).projectedPoints).toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">vs PROJ</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
