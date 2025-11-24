"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function createListing(playerId: string, notes: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Verify ownership
    const userTeams = await prisma.team.findMany({
        where: { managerId: userId },
        include: { players: true }
    });

    const ownsPlayer = userTeams.some(team => team.players.some(p => p.id === playerId));
    if (!ownsPlayer) {
        throw new Error("You do not own this player.");
    }

    // Check for existing active listing
    const existingListing = await prisma.tradeListing.findFirst({
        where: {
            sellerId: userId,
            playerId: playerId,
            status: "ACTIVE"
        }
    });

    if (existingListing) {
        throw new Error("System Error: Asset is already deployed on the Trade Block.");
    }

    await prisma.tradeListing.create({
        data: {
            sellerId: userId,
            playerId: playerId,
            notes: notes,
            status: "ACTIVE"
        }
    });

    revalidatePath("/market");
    return { success: true };
}

export async function cancelListing(listingId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId }
    });

    if (!listing) throw new Error("Listing not found");

    if (listing.sellerId !== userId) {
        throw new Error("You are not the owner of this listing");
    }

    await prisma.tradeListing.delete({
        where: { id: listingId }
    });

    revalidatePath("/market");
    return { success: true };
}

export async function makeOffer(listingId: string, offeredPlayerId: string, credits: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Verify listing exists and is active
    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId }
    });

    if (!listing || listing.status !== "ACTIVE") {
        throw new Error("Listing not available.");
    }

    if (listing.sellerId === userId) {
        throw new Error("You cannot make an offer on your own listing.");
    }

    // Verify ownership of offered player
    if (offeredPlayerId) {
        const userTeams = await prisma.team.findMany({
            where: { managerId: userId },
            include: { players: true }
        });
        const ownsPlayer = userTeams.some(team => team.players.some(p => p.id === offeredPlayerId));
        if (!ownsPlayer) {
            throw new Error("You do not own the player you are offering.");
        }
    }

    // Verify credits
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < credits) {
        throw new Error("Insufficient credits.");
    }

    await prisma.tradeOffer.create({
        data: {
            listingId: listingId,
            offererId: userId,
            offeredPlayerId: offeredPlayerId || null,
            offeredCredits: credits,
            status: "PENDING"
        }
    });

    revalidatePath("/market");
    return { success: true };
}

export async function acceptOffer(offerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const offer = await prisma.tradeOffer.findUnique({
        where: { id: offerId },
        include: {
            listing: true,
            offerer: true
        }
    });

    if (!offer) throw new Error("Offer not found.");
    if (offer.listing.sellerId !== userId) throw new Error("Unauthorized.");
    if (offer.listing.status !== "ACTIVE") throw new Error("Listing is no longer active.");

    // Transaction
    await prisma.$transaction(async (tx) => {
        // 1. Validate & Fetch
        // (Already fetched offer and listing above, but we need fresh data inside TX if we want strict serializability, 
        // but for this logic, the outer fetch is likely fine as long as we check status)

        // Double check status inside TX to prevent race conditions
        const currentListing = await tx.tradeListing.findUnique({ where: { id: offer.listingId } });
        if (!currentListing || currentListing.status !== "ACTIVE") {
            throw new Error("Listing is no longer active.");
        }

        // 2. Asset Swap (The Core Logic)
        const sellerTeams = await tx.team.findMany({
            where: {
                managerId: userId,
                players: { some: { id: offer.listing.playerId } }
            },
            include: { players: true }
        });

        const offererTeams = await tx.team.findMany({
            where: { managerId: offer.offererId },
            include: { players: true }
        });

        let tradeExecuted = false;

        for (const sTeam of sellerTeams) {
            const oTeam = offererTeams.find(t => t.leagueId === sTeam.leagueId);

            if (oTeam) {
                // Check if offerer has the offered player in this league (if applicable)
                const offererHasPlayer = offer.offeredPlayerId
                    ? oTeam.players.some(p => p.id === offer.offeredPlayerId)
                    : true;

                if (offererHasPlayer) {
                    // Step 2A: Seller Receives Offer Player (if any) & Loses Listing Player
                    await tx.team.update({
                        where: { id: sTeam.id },
                        data: {
                            players: {
                                disconnect: { id: offer.listing.playerId },
                                ...(offer.offeredPlayerId ? { connect: { id: offer.offeredPlayerId } } : {})
                            }
                        }
                    });

                    // Step 2B: Offerer Receives Listing Player & Loses Offer Player (if any)
                    await tx.team.update({
                        where: { id: oTeam.id },
                        data: {
                            players: {
                                connect: { id: offer.listing.playerId },
                                ...(offer.offeredPlayerId ? { disconnect: { id: offer.offeredPlayerId } } : {})
                            }
                        }
                    });

                    tradeExecuted = true;
                }
            }
        }

        if (!tradeExecuted) {
            throw new Error("Trade failed: Users do not share a league where the assets exist.");
        }

        // 3. Credit Transfer (The Sweetener)
        if (offer.offeredCredits > 0) {
            // Subtract from offerer
            await tx.user.update({
                where: { id: offer.offererId },
                data: { credits: { decrement: offer.offeredCredits } }
            });
            // Add to seller
            await tx.user.update({
                where: { id: userId },
                data: { credits: { increment: offer.offeredCredits } }
            });
        }

        // 4. Cleanup & Status Update
        await tx.tradeListing.update({
            where: { id: offer.listingId },
            data: { status: "COMPLETED" }
        });

        await tx.tradeOffer.update({
            where: { id: offerId },
            data: { status: "ACCEPTED" }
        });

        await tx.tradeOffer.updateMany({
            where: { listingId: offer.listingId, id: { not: offerId } },
            data: { status: "REJECTED" }
        });

        // 5. Notifications
        // Notify Sender (Offerer)
        await tx.notification.create({
            data: {
                userId: offer.offererId,
                type: "TRADE_ACCEPTED",
                title: "Trade Accepted",
                message: `Your offer for ${offer.listing.playerId} has been accepted!`
            }
        });

        // Notify Receiver (Seller - You)
        await tx.notification.create({
            data: {
                userId: userId,
                type: "TRADE_COMPLETE",
                title: "Trade Complete",
                message: `You have successfully traded ${offer.listing.playerId}.`
            }
        });
    });

    revalidatePath("/market");
    return { success: true, message: "Transaction Complete" };
}

export async function rejectOffer(offerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const offer = await prisma.tradeOffer.findUnique({
        where: { id: offerId },
        include: {
            listing: true
        }
    });

    if (!offer) throw new Error("Offer not found.");

    // Only the seller (listing owner) can reject an offer
    if (offer.listing.sellerId !== userId) throw new Error("Unauthorized.");

    await prisma.tradeOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" }
    });

    // Notify Offerer
    await prisma.notification.create({
        data: {
            userId: offer.offererId,
            type: "TRADE_REJECTED",
            title: "Offer Rejected",
            message: `Your offer for ${offer.listing.playerId} was declined.`
        }
    });

    revalidatePath("/market");
    return { success: true };
}

export async function getOffersForListing(listingId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId },
        select: { sellerId: true }
    });

    if (!listing) throw new Error("Listing not found");
    if (listing.sellerId !== userId) throw new Error("Unauthorized");

    const offers = await prisma.tradeOffer.findMany({
        where: {
            listingId: listingId,
            status: "PENDING"
        },
        include: {
            offerer: true,
            offeredPlayer: true
        },
        orderBy: { createdAt: "desc" }
    });

    return offers;
}
