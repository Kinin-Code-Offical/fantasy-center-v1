"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notifications";
import { assertVerified } from "@/lib/auth/guard";
import { logTransaction, logTrade } from "@/lib/logger";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { getTradeRedirectUrl } from "@/lib/trade-url-helper";

export async function createListing(playerId: string, notes: string) {
    await assertVerified();
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
    if (!session?.user) return { success: false, message: "Unauthorized" };
    const userId = (session.user as any).id;

    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId }
    });

    if (!listing || listing.sellerId !== userId) {
        return { success: false, message: "Permission Denied or Listing Not Found" };
    }

    await prisma.tradeListing.update({
        where: { id: listingId },
        data: { status: "CANCELLED" }
    });

    revalidatePath("/market");
    return { success: true, message: "Listing revoked successfully." };
}

export async function makeOffer(listingId: string, offeredPlayerId: string, credits: number) {
    await assertVerified();
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Verify listing exists and is active
    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId },
        include: { player: true }
    });

    if (!listing || listing.status !== "ACTIVE") {
        throw new Error("Listing not available.");
    }

    if (listing.sellerId === userId) {
        throw new Error("You cannot make an offer on your own listing.");
    }

    // 1. Identify Context (League & Teams) for Yahoo Sync
    const sellerTeams = await prisma.team.findMany({
        where: {
            managerId: listing.sellerId,
            players: { some: { id: listing.playerId } }
        },
        include: {
            league: {
                include: { game: true }
            }
        }
    });

    const offererTeams = await prisma.team.findMany({
        where: {
            managerId: userId,
            leagueId: { in: sellerTeams.map(t => t.leagueId) }
        },
        include: { league: true }
    });

    let targetLeague = null;
    let sellerTeam = null;
    let offererTeam = null;

    for (const sTeam of sellerTeams) {
        const oTeam = offererTeams.find(t => t.leagueId === sTeam.leagueId);
        if (oTeam) {
            // If offering a player, ensure ownership in this specific league
            if (offeredPlayerId) {
                const ownsOffered = await prisma.team.findFirst({
                    where: {
                        id: oTeam.id,
                        players: { some: { id: offeredPlayerId } }
                    }
                });
                if (!ownsOffered) continue;
            }

            targetLeague = sTeam.league;
            sellerTeam = sTeam;
            offererTeam = oTeam;
            break;
        }
    }

    if (!targetLeague || !sellerTeam || !offererTeam) {
        throw new Error("Could not find a matching Yahoo league context for this trade.");
    }

    // 2. Generate Yahoo Redirect URL (Read-Only Mode)
    const leagueKey = targetLeague.yahooLeagueKey;
    const sourceTeamKey = offererTeam.yahooTeamKey;
    const targetTeamKey = sellerTeam.yahooTeamKey;

    const offeredPlayerKeys = offeredPlayerId ? [offeredPlayerId] : [];
    const requestedPlayerKeys = [listing.playerId];

    const redirectUrl = getTradeRedirectUrl(targetLeague.game.code, leagueKey, sourceTeamKey, targetTeamKey, offeredPlayerKeys, requestedPlayerKeys);

    // 3. Create Internal Offer
    await prisma.tradeOffer.create({
        data: {
            listingId: listingId,
            offererId: userId,
            offeredPlayerId: offeredPlayerId || null,
            offeredCredits: credits,
            status: "PENDING"
        }
    });

    // Send Notification to Seller
    await createNotification(
        listing.sellerId,
        "TRADE_OFFER",
        "INCOMING CONTRACT PROPOSAL",
        `A manager has submitted an offer for ${listing.player.fullName}. Review immediately.`,
        `/trades`
    );

    revalidatePath("/market");
    return { success: true, redirectUrl };
}

export async function acceptOffer(offerId: string) {
    await assertVerified();
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

    // Yahoo Sync
    // Read-Only Mode: We cannot accept on Yahoo via API.
    // User must accept manually on Yahoo.
    // We will return a redirect URL if possible, or just instruct the user.

    let redirectUrl = null;
    try {
        const sellerTeams = await prisma.team.findMany({
            where: { managerId: userId, players: { some: { id: offer.listing.playerId } } },
            include: {
                league: {
                    include: { game: true }
                }
            }
        });
        const offererTeams = await prisma.team.findMany({
            where: { managerId: offer.offererId }
        });

        for (const sTeam of sellerTeams) {
            const oTeam = offererTeams.find(t => t.leagueId === sTeam.leagueId);
            if (oTeam) {
                const gameCode = sTeam.league.game?.code || "nfl";
                const leagueId = sTeam.league.yahooLeagueKey.split('.').pop();
                redirectUrl = `https://${gameCode}.fantasysports.yahoo.com/${gameCode}/${leagueId}/transactions`;
                break;
            }
        }
    } catch (error) {
        console.warn("[Yahoo Sync] Failed to generate redirect URL.", error);
    }

    if (redirectUrl) {
        return { success: true, message: "Please accept this trade on Yahoo directly.", redirectUrl };
    }

    return { success: false, message: "Could not determine Yahoo league context. Please accept on Yahoo manually.", redirectUrl: undefined };

    /*
    // DEPRECATED: Local execution is disabled in favor of Sync-Only flow.
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

            // Log Financial Transaction
            await logTransaction(userId, offer.offeredCredits, "TRADE_INCOME", `Trade Income: ${offer.listing.playerId}`, tx);
            await logTransaction(offer.offererId, -offer.offeredCredits, "TRADE_EXPENSE", `Trade Expense: ${offer.listing.playerId}`, tx);
        }

        // Log Trade History
        await logTrade(
            userId,
            offer.offererId,
            { playerId: offer.listing.playerId }, // Assets Given by Seller
            { playerId: offer.offeredPlayerId, credits: offer.offeredCredits }, // Assets Given by Buyer
            tx
        );

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
    */
} export async function rejectOffer(offerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, message: "Unauthorized" };
    const userId = (session.user as any).id;

    const offer = await prisma.tradeOffer.findUnique({
        where: { id: offerId },
        include: { listing: true }
    });

    if (!offer) throw new Error("Offer not found.");
    if (offer.listing.sellerId !== userId) throw new Error("Unauthorized.");

    // Yahoo Sync: Redirect URL
    let redirectUrl = null;
    try {
        const sellerTeam = await prisma.team.findFirst({
            where: {
                managerId: userId,
                players: { some: { id: offer.listing.playerId } }
            },
            include: {
                league: {
                    include: { game: true }
                }
            }
        });

        if (sellerTeam) {
            const gameCode = sellerTeam.league.game?.code || "nfl";
            const leagueId = sellerTeam.league.yahooLeagueKey.split('.').pop();
            redirectUrl = `https://${gameCode}.fantasysports.yahoo.com/${gameCode}/${leagueId}/transactions`;
        }
    } catch (error) {
        console.warn("[Yahoo Sync] Failed to generate redirect URL for reject.", error);
    }

    await prisma.tradeOffer.update({
        where: { id: offerId },
        data: { status: "REJECTED" }
    });

    revalidatePath("/market");
    revalidatePath("/trades");
    return { success: true, redirectUrl };
}

export async function cancelOffer(offerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, message: "Unauthorized" };
    const userId = (session.user as any).id;

    const offer = await prisma.tradeOffer.findUnique({
        where: { id: offerId },
        include: { listing: true }
    });

    if (!offer || offer.offererId !== userId) {
        return { success: false, message: "Permission Denied" };
    }

    // Yahoo Sync: Redirect URL
    let redirectUrl = null;
    try {
        // Find the league context via the seller's team (since they own the listed player)
        const sellerTeam = await prisma.team.findFirst({
            where: {
                managerId: offer.listing.sellerId,
                players: { some: { id: offer.listing.playerId } }
            },
            include: {
                league: {
                    include: { game: true }
                }
            }
        });

        if (sellerTeam) {
            const gameCode = sellerTeam.league.game?.code || "nfl";
            const leagueId = sellerTeam.league.yahooLeagueKey.split('.').pop();
            redirectUrl = `https://${gameCode}.fantasysports.yahoo.com/${gameCode}/${leagueId}/transactions`;
        }
    } catch (error) {
        console.warn("[Yahoo Sync] Failed to generate redirect URL for cancel.", error);
    }

    await prisma.tradeOffer.update({
        where: { id: offerId },
        data: { status: "CANCELLED" }
    });

    revalidatePath("/market");
    revalidatePath("/trades");
    return { success: true, redirectUrl };
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
            offeredPlayer: true,
            listing: {
                include: {
                    player: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return offers;
}

export async function getPendingOffersCount() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return 0;

    // Count offers on my listings
    const count = await prisma.tradeOffer.count({
        where: {
            listing: {
                sellerId: userId,
                status: "ACTIVE"
            },
            status: "PENDING"
        }
    });

    return count;
}

export async function makeDirectOffer(targetPlayerId: string, offeredPlayerId: string, credits: number, leagueId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // 1. Verify Target Player
    const targetPlayer = await prisma.player.findUnique({
        where: { id: targetPlayerId },
        include: {
            teams: {
                where: { leagueId: leagueId },
                include: {
                    manager: true,
                    league: {
                        include: { game: true }
                    }
                }
            }
        }
    });

    if (!targetPlayer) throw new Error("Target player not found.");
    const targetTeam = targetPlayer.teams[0];
    if (!targetTeam) throw new Error("Target player is not in this league.");
    const targetManagerId = targetTeam.managerId;

    if (targetManagerId === userId) {
        throw new Error("You cannot trade with yourself.");
    }

    // 2. Verify Ownership of Offered Player
    if (offeredPlayerId) {
        const userTeams = await prisma.team.findMany({
            where: { managerId: userId, leagueId: leagueId },
            include: { players: true }
        });
        const ownsPlayer = userTeams.some(team => team.players.some(p => p.id === offeredPlayerId));
        if (!ownsPlayer) {
            throw new Error("You do not own the player you are offering.");
        }
    }

    // 3. Create "Shadow" Listing (Direct Request)
    // We create a listing to attach the offer to, but it's not "ACTIVE" in the public market.
    const listing = await prisma.tradeListing.create({
        data: {
            sellerId: targetManagerId, // The owner of the target player is the "seller"
            playerId: targetPlayerId,
            status: "DIRECT_REQUEST", // Special status
            notes: "Direct Offer Initiated",
        }
    });

    // 4. Create the Offer
    await prisma.tradeOffer.create({
        data: {
            listingId: listing.id,
            offererId: userId,
            offeredPlayerId: offeredPlayerId || null,
            offeredCredits: credits,
            status: "PENDING"
        }
    });

    // 5. Notification
    await createNotification(
        targetManagerId,
        "DIRECT_TRADE_REQUEST",
        `New trade offer received for ${targetPlayer.fullName}`,
        `/market/${listing.id}` // Or wherever they should view it. Maybe /trades?
    );

    // 6. Generate Redirect URL
    const targetLeague = targetTeam.league || await prisma.league.findUnique({ where: { id: leagueId }, include: { game: true } });

    const offererTeam = await prisma.team.findFirst({
        where: { managerId: userId, leagueId: leagueId }
    });

    if (!offererTeam) {
        throw new Error("You must have a team in this league to trade.");
    }

    const leagueKey = targetLeague.yahooLeagueKey;
    const sourceTeamKey = offererTeam.yahooTeamKey;
    const targetTeamKey = targetTeam.yahooTeamKey;

    const offeredPlayerKeys = offeredPlayerId ? [offeredPlayerId] : [];
    const requestedPlayerKeys = [targetPlayerId];

    const redirectUrl = getTradeRedirectUrl(targetLeague.game.code, leagueKey, sourceTeamKey, targetTeamKey, offeredPlayerKeys, requestedPlayerKeys);

    revalidatePath("/market");
    revalidatePath("/trades");
    return { success: true, listingId: listing.id, redirectUrl };
}
