import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { Settings, UserPlus, MessageSquare, ShieldAlert, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface PageProps {
    params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const session = await getServerSession(authOptions);

    const user = await prisma.user.findFirst({
        where: { username: decodedUsername },
        include: {
            teams: {
                include: {
                    league: true
                }
            },
            ledgers: {
                orderBy: { createdAt: 'desc' },
                take: 10
            },
            salesHistory: {
                orderBy: { completedAt: 'desc' },
                take: 5,
                include: { buyer: true }
            },
            purchaseHistory: {
                orderBy: { completedAt: 'desc' },
                take: 5,
                include: { seller: true }
            },
            tradesInitiated: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { targetUser: true }
            },
            tradesReceived: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { initiator: true }
            }
        }
    });

    if (!user) {
        notFound();
    }

    const isOwner = session?.user?.email === user.email;

    // Fetch MatchHistory
    const teamIds = user.teams.map((t) => t.id);
    const recentMatchups = await prisma.matchup.findMany({
        where: {
            OR: [
                { teamAId: { in: teamIds } },
                { teamBId: { in: teamIds } }
            ],
            status: "finished"
        },
        include: {
            teamA: true,
            teamB: true,
            league: true
        },
        orderBy: { week: 'desc' },
        take: 5
    });

    // Combine trades for Activity Log
    const tradeHistory = [
        ...user.salesHistory.map(t => ({ ...t, role: 'SELLER', otherUser: t.buyer })),
        ...user.purchaseHistory.map(t => ({ ...t, role: 'BUYER', otherUser: t.seller }))
    ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 10);

    return (
        <div className="w-full h-auto md:h-full md:overflow-y-auto bg-[#050505] text-slate-200 pt-24 px-4 md:px-8 pb-20 relative font-sans custom-scrollbar">

            <div className="max-w-5xl mx-auto relative z-10 min-h-full">
                <div className="mb-8 flex justify-between items-center">
                    <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors text-sm tracking-widest uppercase font-mono">
                        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-green-500/50 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span>Return to Base</span>
                    </Link>
                </div>

                {/* Glassmorphism Container */}
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Header Section */}
                    <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-r from-green-900/10 to-transparent relative">
                        <div className="absolute top-0 right-0 p-4 opacity-20 hidden md:block">
                            <div className="w-32 h-32 border border-green-500/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                        </div>

                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
                            {/* Avatar with Glowing Ring */}
                            <div className="relative group shrink-0">
                                <div className="absolute -inset-0.5 bg-green-500 rounded-full opacity-50 blur group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.5)] bg-black">
                                    {user.avatarUrl || user.image ? (
                                        <Image
                                            src={user.avatarUrl || user.image!}
                                            alt={user.username || "User"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-green-500 text-2xl md:text-4xl font-bold">
                                            {(user.username?.[0] || user.email?.[0] || "?").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="text-center md:text-left space-y-2 w-full md:w-auto">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start">
                                    {user.username}
                                    
                                    {/* Verification Badge */}
                                    {user.emailVerified ? (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-[10px] text-green-400 font-mono tracking-widest" title="Verified Identity">
                                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                                        </div>
                                    ) : (
                                        isOwner && (
                                            <Link href="/settings" className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-[10px] text-yellow-400 font-mono tracking-widest hover:bg-yellow-500/30 transition-colors" title="Identity Unverified">
                                                <ShieldAlert className="w-3 h-3" /> UNVERIFIED
                                            </Link>
                                        )
                                    )}
                                </h1>

                                {/* Real Name Display */}
                                {(user.firstName || user.lastName) && (
                                    <div className="text-base md:text-lg text-slate-400 font-mono flex items-center justify-center md:justify-start gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {user.firstName} {user.lastName}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-sm text-slate-400 font-mono">
                                    <p className="text-gray-500 font-mono text-xs md:text-sm tracking-wider">@{user.username?.toLowerCase() || "user"}</p>
                                    {user.birthDate && (
                                        <span className="flex items-center gap-2">
                                            <span className="text-green-500 text-[10px] md:text-xs font-bold uppercase">Inception:</span>
                                            <span className="text-gray-400 text-[10px] md:text-xs font-mono">
                                                {new Date(user.birthDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {user.bio && (
                                    <p className="text-gray-400 max-w-md mt-4 text-xs md:text-sm leading-relaxed border-l-2 border-green-500/30 pl-3 mx-auto md:mx-0 text-left">
                                        {user.bio}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="w-full md:w-auto md:ml-auto flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
                                {isOwner ? (
                                    <Link href="/settings" className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-green-500/10 border border-green-500/50 text-green-400 rounded hover:bg-green-500/20 transition-all group w-full md:w-auto">
                                        <Settings size={16} className="group-hover:rotate-90 transition-transform" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Edit Profile</span>
                                    </Link>
                                ) : (
                                    session?.user && (
                                        <>
                                            <button className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-all w-full md:w-auto">
                                                <UserPlus size={16} />
                                                <span className="text-sm font-bold uppercase tracking-wider">Add Friend</span>
                                            </button>
                                            <button className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/20 transition-all w-full md:w-auto">
                                                <MessageSquare size={16} />
                                                <span className="text-sm font-bold uppercase tracking-wider">Message</span>
                                            </button>
                                        </>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row (HUD Style) */}
                    <div className="grid grid-cols-2 md:flex md:divide-x divide-white/10 bg-black/40 border-b border-white/10">
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors flex-1 border-r border-white/10 md:border-r-0">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Reputation</p>
                            <p className="text-xl md:text-2xl font-mono font-bold text-white">{user.reputation}</p>
                        </div>
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Credits</p>
                            <p className="text-xl md:text-2xl font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                ₳ {user.credits.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors col-span-2 md:col-span-1 flex-1 border-t border-white/10 md:border-t-0">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Leagues</p>
                            <p className="text-xl md:text-2xl font-mono font-bold text-white">{user.teams.length}</p>
                        </div>
                    </div>

                    {/* Data Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

                        {/* Match History */}
                        <div className="p-4 md:p-6 bg-black/20">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Match History
                                </h2>
                                <span className="text-[10px] font-mono text-gray-600">LOGS.COMBAT</span>
                            </div>

                            <div className="space-y-4 md:space-y-3">
                                {recentMatchups.length === 0 ? (
                                    <div className="p-4 border border-dashed border-gray-800 rounded bg-black/40 text-center">
                                        <p className="text-xs font-mono text-gray-600">[SYSTEM]: NO DATA DETECTED</p>
                                    </div>
                                ) : (
                                    recentMatchups.map(match => {
                                        const isTeamA = user.teams.some(t => t.id === match.teamAId);
                                        const userTeam = isTeamA ? match.teamA : match.teamB;
                                        const opponentTeam = isTeamA ? match.teamB : match.teamA;
                                        const userScore = isTeamA ? match.teamAScore : match.teamBScore;
                                        const opponentScore = isTeamA ? match.teamBScore : match.teamAScore;
                                        const isWinner = userScore > opponentScore;

                                        return (
                                            <div key={match.id} className="group relative pl-4 border-l border-gray-800 hover:border-green-500 transition-colors pb-4 md:pb-0 border-b md:border-b-0 border-white/5 last:border-b-0">
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
                                                    <div>
                                                        <p className="text-xs text-gray-400 group-hover:text-white transition-colors font-bold">vs {opponentTeam.name}</p>
                                                        <p className="text-[10px] text-gray-600 font-mono">{match.league.name} • Week {match.week}</p>
                                                    </div>
                                                    <div className={`text-xs font-mono font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Activity Column */}
                        <div className="flex flex-col divide-y divide-white/10 bg-black/20">
                            
                            {/* Wallet Activity */}
                            <div className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Wallet Activity
                                    </h2>
                                    <span className="text-[10px] font-mono text-gray-600">LOGS.FINANCE</span>
                                </div>

                                <div className="space-y-3">
                                    {user.ledgers.length === 0 ? (
                                        <div className="p-4 border border-dashed border-gray-800 rounded bg-black/40 text-center">
                                            <p className="text-xs font-mono text-gray-600">[SYSTEM]: NO DATA DETECTED</p>
                                        </div>
                                    ) : (
                                        user.ledgers.map((ledger) => (
                                            <div key={ledger.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors group">
                                                <div>
                                                    <p className="text-xs text-gray-300 group-hover:text-white transition-colors font-bold">{ledger.description}</p>
                                                    <p className="text-[10px] text-gray-600 font-mono">{new Date(ledger.createdAt).toLocaleDateString('en-GB')}</p>
                                                </div>
                                                <div className={`text-xs font-mono font-bold ${ledger.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {ledger.amount >= 0 ? '+' : ''}{ledger.amount}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Recent Trades */}
                            <div className="p-4 md:p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Recent Trades
                                    </h2>
                                    <span className="text-[10px] font-mono text-gray-600">LOGS.TRADE</span>
                                </div>

                                <div className="space-y-3">
                                    {tradeHistory.length === 0 ? (
                                        <div className="p-4 border border-dashed border-gray-800 rounded bg-black/40 text-center">
                                            <p className="text-xs font-mono text-gray-600">[SYSTEM]: NO DATA DETECTED</p>
                                        </div>
                                    ) : (
                                        tradeHistory.map((trade) => (
                                            <div key={trade.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors group">
                                                <div>
                                                    <p className="text-xs text-gray-300 group-hover:text-white transition-colors font-bold">
                                                        {trade.role === 'SELLER' ? 'Sold to' : 'Bought from'} <span className="text-green-400">@{trade.otherUser.username}</span>
                                                    </p>
                                                    <p className="text-[10px] text-gray-600 font-mono">{new Date(trade.completedAt).toLocaleDateString('en-GB')}</p>
                                                </div>
                                                <div className="text-xs font-mono text-gray-500">
                                                    COMPLETED
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Danger Zone (Owner Only) */}
                    {isOwner && (
                        <div className="p-8 border-t border-red-500/20 bg-red-950/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-red-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <ShieldAlert size={18} />
                                        Danger Zone
                                    </h3>
                                    <p className="text-red-400/50 text-xs font-mono mt-1">IRREVERSIBLE ACTIONS</p>
                                </div>
                                <DeleteAccountButton />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
