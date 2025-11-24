import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LeagueCard from "@/components/LeagueCard";
import DashboardSyncButton from "@/components/DashboardSyncButton";
import NotificationCenter from "@/components/NotificationCenter";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
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

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: {
            teams: {
                include: {
                    league: {
                        include: {
                            game: true
                        }
                    }
                }
            }
        }
    });

    if (!user) redirect("/login");

    return (
        <div className="w-full h-auto md:h-full md:overflow-y-auto p-4 md:p-8 pt-24 pb-20 relative font-sans custom-scrollbar">

            {/* Main HUD Container */}
            <div className="max-w-7xl mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative min-h-full">

                {/* Background Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-3xl" />

                {/* Top Bar */}
                <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/10 pb-6">

                    {/* Left: Return to Base */}
                    <Link href="/" className="group flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-green-500/50 transition-all duration-300">
                        <div className="p-1 rounded-full bg-white/5 group-hover:bg-green-500/20 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300 group-hover:text-white tracking-widest uppercase">Return to Base</span>
                    </Link>

                    {/* Center/Right: Command Center Title */}
                    <div className="text-right flex-1 md:mr-8">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase flex items-center justify-end gap-3">
                            Command Center
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        </h1>
                        <p className="text-[10px] md:text-xs font-mono text-green-500/60 tracking-widest uppercase mt-1">
                            SYSTEM STATUS: ONLINE // USER: {user.username || "UNKNOWN"}
                        </p>
                    </div>

                    {/* Sync Button Integration */}
                    <div className="hidden md:flex items-center gap-4">
                        <NotificationCenter />
                        {user.teams.length > 0 && <DashboardSyncButton />}
                    </div>
                </div>

                {/* Mobile Sync Button */}
                <div className="md:flex items-center justify-between mb-8 md:hidden relative z-20">
                    <NotificationCenter align="left" />
                    {user.teams.length > 0 && <DashboardSyncButton />}
                </div>

                {user.teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {user.teams.map((team) => (
                            <LeagueCard
                                key={team.id}
                                leagueId={team.league.id}
                                leagueName={team.league.name}
                                teamName={team.name}
                                logoUrl={team.logoUrl}
                                gameCode={team.league.game.code}
                                season={team.league.game.season}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">System Offline</h2>
                        <p className="text-slate-400 max-w-md mb-8 font-mono text-sm">
                            No active league data detected in the local database. Initiate synchronization with Yahoo Fantasy servers to populate your dashboard.
                        </p>
                        <DashboardSyncButton variant="large" />
                    </div>
                )}
            </div>
        </div>
    );
}
