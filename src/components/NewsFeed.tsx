import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function NewsFeed() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const userId = (session.user as any).id;

    // Fetch News
    const playerIds = new Set<string>();

    // Get user teams and players
    const userWithTeams = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            teams: {
                include: {
                    players: true
                }
            }
        }
    });

    if (userWithTeams) {
        userWithTeams.teams.forEach(t => t.players.forEach(p => playerIds.add(p.id)));
    }

    // Get followed players
    const follows = await prisma.playerFollow.findMany({
        where: { userId: userId },
        select: { playerId: true }
    });
    follows.forEach(f => playerIds.add(f.playerId));

    const news = await prisma.playerNews.findMany({
        where: {
            playerId: { in: Array.from(playerIds) }
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        include: { player: true }
    });

    return (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 h-full max-h-[600px] overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Intelligence Feed
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {news.length > 0 ? news.map((item) => (
                    <Link href={`/player/${item.playerId}`} key={item.id} className="block group">
                        <div className="p-3 bg-white/5 border border-white/5 rounded-lg group-hover:border-green-500/30 group-hover:bg-white/10 transition-all">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 border border-white/10">
                                    {item.player.photoUrl ? (
                                        <img src={item.player.photoUrl} alt={item.player.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {item.player.fullName.substring(0, 2)}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2 leading-tight">
                                        {item.headline}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                            {item.source || 'Yahoo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="text-center py-10 text-gray-500 text-xs font-mono">
                        SYSTEM SCANNING... NO INTEL FOUND
                    </div>
                )}
            </div>
        </div>
    );
}
