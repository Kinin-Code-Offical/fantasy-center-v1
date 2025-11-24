import Link from "next/link";

interface Team {
    id: string;
    name: string;
    wins: number;
    losses: number;
    ties: number;
    rank: number | null;
    isUserTeam: boolean;
}

interface StandingsWidgetProps {
    teams: Team[];
    leagueId: string;
    viewTeamId?: string;
}

export default function StandingsWidget({ teams, leagueId, viewTeamId }: StandingsWidgetProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />

            <h3 className="mb-6 text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between relative z-10">
                <span className="flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                    League Standings
                </span>
                <span className="text-[10px] font-mono text-green-500/50">LIVE</span>
            </h3>

            <div className="space-y-2 relative z-10">
                {teams.map((team) => {
                    const isActive = viewTeamId === team.id;
                    
                    return (
                        <Link
                            key={team.id}
                            href={`/league/${leagueId}?viewTeamId=${team.id}`}
                            scroll={false}
                            className={`group flex items-center justify-between p-3 rounded border transition-all duration-300 ${
                                isActive 
                                    ? "bg-green-900/30 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] translate-x-1"
                                    : team.isUserTeam
                                        ? "bg-green-900/10 border-green-500/30 hover:bg-green-900/20"
                                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold font-mono border ${
                                    isActive || team.isUserTeam
                                        ? "bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                        : "bg-black text-gray-500 border-white/10"
                                }`}>
                                    {team.rank || "-"}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-xs font-bold uppercase tracking-wide ${
                                        isActive || team.isUserTeam ? "text-green-400" : "text-gray-300 group-hover:text-white"
                                    }`}>
                                        {team.name}
                                    </span>
                                    {team.isUserTeam && (
                                        <span className="text-[8px] font-mono text-green-500/50 uppercase tracking-widest">
                                            &gt;&gt; YOUR TEAM
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                    <div className="font-mono text-xs font-bold text-white">
                                        {team.wins}-{team.losses}-{team.ties}
                                    </div>
                                    <div className="text-[8px] text-gray-600 font-mono uppercase">
                                        W-L-T
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
