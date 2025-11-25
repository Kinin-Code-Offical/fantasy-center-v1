import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import TradeOfferInterface from "./TradeOfferInterface";

interface PageProps {
    params: Promise<{ listingId: string }>;
}

export default async function OfferPage({ params }: PageProps) {
    const { listingId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId },
        include: {
            seller: true,
            player: {
                include: {
                    teams: {
                        include: { league: true }
                    }
                }
            }
        }
    });

    if (!listing) {
        notFound();
    }

    // Determine the league context
    const sellerTeam = listing.player.teams.find((t: any) => t.managerId === listing.sellerId);
    const targetLeagueId = sellerTeam?.leagueId;
    const targetLeagueName = sellerTeam?.league.name;
    const targetYahooLeagueKey = sellerTeam?.league.yahooLeagueKey;

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
    const validUserPlayers = targetLeagueId
        ? user.teams
            .filter(t => t.leagueId === targetLeagueId)
            .flatMap(t => t.players)
        : [];

    return (
        <TradeOfferInterface
            listing={listing}
            userPlayers={validUserPlayers}
            currentUserId={user.id}
            leagueName={targetLeagueName}
            leagueId={targetLeagueId}
            yahooLeagueKey={targetYahooLeagueKey}
        />
    );
}
