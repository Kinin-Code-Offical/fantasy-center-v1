import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NewsFeedClient from "./NewsFeedClient";

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

    return <NewsFeedClient news={news} />;
}
