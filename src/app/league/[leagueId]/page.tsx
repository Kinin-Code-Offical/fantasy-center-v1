import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DashboardSyncButton from "@/components/DashboardSyncButton";
import RosterTable from "@/components/league/RosterTable";
import StandingsWidget from "@/components/league/StandingsWidget";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";

export default async function LeaguePage({ params, searchParams }: { params: Promise<{ leagueId: string }>, searchParams: Promise<{ viewTeamId?: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    // Security Check: Verify Identity
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { emailVerified: true }
        });

        if (user && !user.emailVerified) {
            redirect("/settings");
        }
    }

    const userId = (session.user as any).id;
    const { leagueId } = await params;
    const { viewTeamId } = await searchParams;
    const decodedLeagueId = decodeURIComponent(leagueId);

    // Fetch League Details
    // We try to find by ID first, if not, maybe it's a yahoo key? 
    let league = await prisma.league.findUnique({
        where: { id: decodedLeagueId },
        include: {
            game: true,
            teams: {
                orderBy: { rank: 'asc' },
                include: {
                    manager: true,
                }
            }
        }
    });

    if (!league) {
        // Try by Yahoo League Key
        league = await prisma.league.findUnique({
            where: { yahooLeagueKey: decodedLeagueId },
            include: {
                game: true,
                teams: {
                    orderBy: { rank: 'asc' },
                    include: {
                        manager: true,
                    }
                }
            }
        });
    }

    if (!league) {
        return notFound();
    }

    // Find User's Team in this League
    const userTeam = league.teams.find(t => t.managerId === userId);

    // Determine which team to view
    let displayedTeamId = userTeam?.id;
    if (viewTeamId) {
        // Verify the team belongs to this league
        const requestedTeam = league.teams.find(t => t.id === viewTeamId);
        if (requestedTeam) {
            displayedTeamId = requestedTeam.id;
        }
    }

    const isViewingRival = displayedTeamId !== userTeam?.id;
    const displayedTeam = league.teams.find(t => t.id === displayedTeamId);

    // Fetch Roster for Displayed Team
    let rosterPlayers: any[] = [];
    if (displayedTeamId) {
        const teamWithRoster = await prisma.team.findUnique({
            where: { id: displayedTeamId },
            include: {
                players: {
                    include: {
                        teams: {
                            include: {
                                league: true
                            }
                        }
                    }
                }
            }
        });
        if (teamWithRoster) {
            rosterPlayers = teamWithRoster.players;
        }
    }

    // Fetch User's Players (for trading context)
    let userPlayers: any[] = [];
    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                teams: {
                    include: {
                        players: true,
                        league: true
                    }
                }
            }
        });
        if (user) {
            userPlayers = user.teams
                .filter(team => team.leagueId === league.id)
                .flatMap(team =>
                    team.players.map(player => ({
                        ...player,
                        teamKey: team.yahooTeamKey,
                        league: {
                            id: team.league.id,
                            name: team.league.name,
                            yahooLeagueKey: team.league.yahooLeagueKey
                        }
                    }))
                );
        }
    }

    // Prepare Standings Data
    const standingsData = league.teams.map(team => ({
        id: team.id,
        name: team.name,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        rank: team.rank,
        isUserTeam: team.managerId === userId
    }));

    // Fetch Active Trades for this League (to prevent duplicates)
    const activeYahooTrades = await prisma.yahooTrade.findMany({
        where: {
            leagueId: league.id,
            status: "proposed"
        },
        include: {
            items: true
        }
    });

    return (
        <div className="w-full h-auto md:h-full md:overflow-y-auto bg-[#050505] text-slate-200 pt-8 px-4 md:px-8 pb-20 relative font-sans custom-scrollbar">
            <Navbar />

            {/* Background Grid & Effects */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-b from-green-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 min-h-full">
                {/* Navigation & Breadcrumbs */}
                <div className="mb-8 flex justify-between items-center">
                    <Link href="/" className="group flex items-center gap-3 px-4 py-2 bg-black/40 border border-white/10 rounded-full hover:bg-green-900/20 hover:border-green-500/50 transition-all duration-300 backdrop-blur-md">
                        <div className="p-1 rounded-full bg-white/5 group-hover:bg-green-500/20 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300 group-hover:text-white tracking-widest uppercase">Return to Base</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-green-500/50 uppercase tracking-widest">
                        <span>SECURE CONNECTION</span>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Main Glassmorphism Container */}
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">

                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />

                    {/* League Control Header */}
                    <div className="p-8 border-b border-white/10 bg-gradient-to-r from-green-900/5 via-transparent to-transparent relative overflow-hidden">
                        {/* Background Pattern in Header */}
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)] pointer-events-none" />

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                        {league.game.code.toUpperCase()} :: SEASON {league.game.season}
                                    </span>
                                    <span className="text-gray-600 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1 h-1 bg-gray-500 rounded-full" />
                                        ID: {league.yahooLeagueKey || league.id}
                                    </span>
                                </div>

                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    {league.name}
                                </h1>

                                {/* Stats Bar */}
                                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400 bg-black/40 px-4 py-2 rounded-lg border border-white/5 w-fit backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">LEAGUE SIZE:</span>
                                        <span className="text-white">{league.numTeams}</span>
                                    </div>
                                    <span className="text-gray-700">|</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">WEEK:</span>
                                        <span className="text-white">{league.currentWeek}</span>
                                    </div>
                                    <span className="text-gray-700">|</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">STATUS:</span>
                                        <span className="flex items-center gap-1.5 text-white">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                                            ACTIVE
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <DashboardSyncButton />
                                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                                    Last Sync: {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Roster */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                    </span>
                                    {displayedTeam ? displayedTeam.name : "Active Roster"}
                                </h2>
                                <div className="text-xs font-mono text-cyan-500/70 bg-cyan-950/30 px-3 py-1 rounded border border-cyan-500/20">
                                    {rosterPlayers.length} UNITS DEPLOYED
                                </div>
                            </div>
                            <RosterTable
                                players={rosterPlayers}
                                leagueId={league.id}
                                isViewingRival={isViewingRival}
                                userPlayers={userPlayers}
                                targetTeamId={displayedTeamId}
                                activeTrades={activeYahooTrades}
                            />
                        </div>

                        {/* Sidebar - Standings & Info */}
                        <div className="space-y-6">
                            <StandingsWidget teams={standingsData} leagueId={league.id} viewTeamId={displayedTeamId} />

                            {/* Additional Info Widget (Placeholder for future) */}
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">System Logs</h3>
                                <div className="space-y-3 font-mono text-[10px] text-gray-600">
                                    <div className="flex justify-between">
                                        <span>&gt; CONNECTION ESTABLISHED</span>
                                        <span className="text-green-500/50">OK</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>&gt; ROSTER DATA SYNCED</span>
                                        <span className="text-green-500/50">OK</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>&gt; PROJECTED POINTS CALC</span>
                                        <span className="text-yellow-500/50">PENDING</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
