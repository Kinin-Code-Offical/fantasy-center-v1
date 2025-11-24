import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import DirectTradeConsole from "./DirectTradeConsole";

interface PageProps {
    searchParams: Promise<{ targetPlayerId?: string; leagueId?: string }>;
}

export default async function NewTradePage({ searchParams }: PageProps) {
    const { targetPlayerId, leagueId } = await searchParams;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    if (!targetPlayerId || !leagueId) {
        redirect("/market");
    }

    // Fetch Target Player
    const targetPlayer = await prisma.player.findUnique({
        where: { id: targetPlayerId },
        include: {
            teams: {
                where: { leagueId: leagueId },
                include: {
                    manager: true,
                    league: true
                }
            }
        }
    });

    if (!targetPlayer) {
        notFound();
    }

    // Find the specific team/manager in this league
    const targetTeam = targetPlayer.teams[0];
    if (!targetTeam) {
        notFound();
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            teams: {
                include: {
                    players: true
                }
            }
        }
    });

    if (!user) {
        redirect("/login");
    }

    // Filter user players to only those in the same league
    const validUserPlayers = user.teams
            .filter(t => t.leagueId === leagueId)
            .flatMap(t => t.players);

    return (
        <DirectTradeConsole
            targetPlayer={targetPlayer}
            targetTeam={targetTeam}
            userPlayers={validUserPlayers}
            currentUserId={user.id}
            leagueId={leagueId}
        />
    );
}
