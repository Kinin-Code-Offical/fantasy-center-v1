import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { Settings, UserPlus, MessageSquare, ShieldAlert, ArrowLeft } from "lucide-react";
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
                take: 5
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
    const activities = [
        ...user.tradesInitiated.map(t => ({ ...t, type: 'TRADE_INIT' })),
        ...user.tradesReceived.map(t => ({ ...t, type: 'TRADE_RECV' })),
        ...user.ledgers.map(l => ({ ...l, type: 'LEDGER' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 pt-24 px-4 md:px-8 pb-20 relative overflow-hidden font-sans">

            <div className="max-w-5xl mx-auto relative z-10">
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
                    <div className="p-8 border-b border-white/10 bg-gradient-to-r from-green-900/10 to-transparent relative">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <div className="w-32 h-32 border border-green-500/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            {/* Avatar with Glowing Ring */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-green-500 rounded-full opacity-50 blur group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.5)] bg-black">
                                    {user.avatarUrl || user.image ? (
                                        <Image
                                            src={user.avatarUrl || user.image!}
                                            alt={user.username || "User"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-green-500 text-4xl font-bold">
                                            {(user.username?.[0] || user.email?.[0] || "?").toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="text-center md:text-left space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2 flex items-center gap-4">
                                    {user.username}
                                    {isOwner && (
                                        <Link href="/settings" className="text-xs font-bold text-green-500 border border-green-500/30 px-3 py-1 rounded hover:bg-green-500/10 transition-colors tracking-widest">
                                            EDIT_PROFILE
                                        </Link>
                                    )}
                                </h1>

                                {/* Real Name Display */}
                                {(user.firstName || user.lastName) && (
                                    <div className="text-lg text-slate-400 font-mono mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {user.firstName} {user.lastName}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-mono">
                                    <p className="text-gray-500 font-mono text-sm tracking-wider">@{user.username?.toLowerCase() || "user"}</p>
                                    {user.birthDate && (
                                        <span className="flex items-center gap-2">
                                            <span className="text-green-500 text-xs font-bold uppercase">Inception:</span>
                                            <span className="text-gray-400 text-xs font-mono">
                                                {new Date(user.birthDate).toLocaleDateString('en-GB')}
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {user.bio && (
                                    <p className="text-gray-400 max-w-md mt-4 text-sm leading-relaxed border-l-2 border-green-500/30 pl-3">
                                        {user.bio}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="md:ml-auto flex gap-3 mt-4 md:mt-0">
                                {isOwner ? (
                                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/50 text-green-400 rounded hover:bg-green-500/20 transition-all group">
                                        <Settings size={16} className="group-hover:rotate-90 transition-transform" />
                                        <span className="text-sm font-bold uppercase tracking-wider">Edit Profile</span>
                                    </Link>
                                ) : (
                                    session?.user && (
                                        <>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded hover:bg-white/10 transition-all">
                                                <UserPlus size={16} />
                                                <span className="text-sm font-bold uppercase tracking-wider">Add Friend</span>
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/20 transition-all">
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
                    <div className="grid grid-cols-3 border-b border-white/10 divide-x divide-white/10 bg-black/40">
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Reputation</p>
                            <p className="text-2xl font-mono font-bold text-white">{user.reputation}</p>
                        </div>
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Credits</p>
                            <p className="text-2xl font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                ₳ {user.credits.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 text-center group hover:bg-white/5 transition-colors">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 group-hover:text-green-400 transition-colors">Leagues</p>
                            <p className="text-2xl font-mono font-bold text-white">{user.teams.length}</p>
                        </div>
                    </div>

                    {/* Data Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">

                        {/* Match History */}
                        <div className="p-6 bg-black/20">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Match History
                                </h2>
                                <span className="text-[10px] font-mono text-gray-600">LOGS.COMBAT</span>
                            </div>

                            <div className="space-y-3">
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
                                            <div key={match.id} className="group relative pl-4 border-l border-gray-800 hover:border-green-500 transition-colors">
                                                <div className="flex justify-between items-center">
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

                        {/* Activity Log */}
                        <div className="p-6 bg-black/20">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Activity Log
                                </h2>
                                <span className="text-[10px] font-mono text-gray-600">LOGS.SYSTEM</span>
                            </div>

                            <div className="space-y-3">
                                {activities.length === 0 ? (
                                    <div className="p-4 border border-dashed border-gray-800 rounded bg-black/40 text-center">
                                        <p className="text-xs font-mono text-gray-600">[SYSTEM]: NO DATA DETECTED</p>
                                    </div>
                                ) : (
                                    activities.map((activity: any) => (
                                        <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded transition-colors group">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-green-500 transition-colors" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-300 group-hover:text-white transition-colors">
                                                    {activity.type === 'LEDGER' ? (
                                                        <span>
                                                            {activity.amount >= 0 ? 'Received' : 'Spent'} <span className={activity.amount >= 0 ? 'text-green-400' : 'text-red-400'}>{Math.abs(activity.amount)} credits</span>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Trade {activity.status.toLowerCase()}
                                                            {activity.type === 'TRADE_INIT' ? ' with ' + (activity.targetUser?.username || 'user') : ' from ' + (activity.initiator?.username || 'user')}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-mono">
                                                    {new Date(activity.createdAt).toLocaleDateString('en-GB')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
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
