"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { syncLeagueTransactions } from "@/lib/actions/sync";

export async function getTradeDashboardData() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const userId = (session.user as any).id;

    // 1. Incoming: My Listings that have offers
    // Instructions: "List all TradeListings created by the user that have status: 'ACTIVE'. Inside each listing, show the received offers."
    const incomingListings = await prisma.tradeListing.findMany({
        where: {
            sellerId: userId,
            status: { in: ["ACTIVE", "DIRECT_REQUEST"] }
        },
        include: {
            player: {
                include: {
                    game: true
                }
            },
            offers: {
                where: { status: "PENDING" },
                include: {
                    offerer: true,
                    offeredPlayer: true
                },
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // 2. Outgoing: Offers I made
    const outgoingOffers = await prisma.tradeOffer.findMany({
        where: {
            offererId: userId,
            status: "PENDING"
        },
        include: {
            listing: {
                include: {
                    player: {
                        include: {
                            game: true
                        }
                    },
                    seller: true
                }
            },
            offeredPlayer: true
        },
        orderBy: { createdAt: "desc" }
    });

    // 3. External: Yahoo Trades (Synced)
    // First, get user's team keys
    const userTeams = await prisma.team.findMany({
        where: { managerId: userId },
        select: { yahooTeamKey: true }
    });
    const teamKeys = userTeams.map(t => t.yahooTeamKey);

    const externalTrades = await prisma.yahooTrade.findMany({
        where: {
            OR: [
                { offeredBy: { in: teamKeys } },
                { offeredTo: { in: teamKeys } }
            ],
            status: "proposed" // Only show active proposals
        },
        include: {
            items: true
        },
        orderBy: { createdAt: "desc" }
    });

    // Enrich external trades with player data
    const enrichedExternalTrades = await Promise.all(externalTrades.map(async (trade) => {
        const itemsWithPlayers = await Promise.all(trade.items.map(async (item) => {
            const player = await prisma.player.findUnique({
                where: { id: item.playerKey }
            });
            return { ...item, player };
        }));
        return { ...trade, items: itemsWithPlayers };
    }));

    return {
        incoming: incomingListings,
        outgoing: outgoingOffers,
        external: enrichedExternalTrades,
        userTeamKeys: teamKeys
    };
}
