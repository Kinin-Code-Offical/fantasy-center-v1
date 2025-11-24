"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getTradeDashboardData() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    const userId = (session.user as any).id;

    // 1. Incoming: My Listings that have offers
    // Instructions: "List all TradeListings created by the user that have status: 'ACTIVE'. Inside each listing, show the received offers."
    const incomingListings = await prisma.tradeListing.findMany({
        where: {
            sellerId: userId,
            status: "ACTIVE"
        },
        include: {
            player: true,
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
                    player: true,
                    seller: true
                }
            },
            offeredPlayer: true
        },
        orderBy: { createdAt: "desc" }
    });

    return {
        incoming: incomingListings,
        outgoing: outgoingOffers
    };
}
