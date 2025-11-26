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
import { sendMarketNotificationEmail } from "@/lib/mail";

export async function createListing(playerId: string, notes: string) {
    await assertVerified();
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Verify ownership
    const userTeams = await prisma.team.findMany({
        where: { managerId: userId },
        include: {
            players: true,
            league: true
        }
    });

    const owningTeam = userTeams.find(team => team.players.some(p => p.id === playerId));
    if (!owningTeam) {
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

    const listing = await prisma.tradeListing.create({
        data: {
            sellerId: userId,
            playerId: playerId,
            notes: notes,
            status: "ACTIVE"
        },
        include: {
            player: true
        }
    });

    // Send Notification to League Members
    // 1. Find all other teams in the same league
    const leagueMembers = await prisma.team.findMany({
        where: {
            leagueId: owningTeam.leagueId,
            managerId: { not: userId } // Exclude seller
        },
        include: {
            manager: {
                select: { email: true }
            }
        }
    });

    // 2. Send emails
    const playerProfileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/player/${playerId}`;

    // Use Promise.allSettled to avoid failing the request if one email fails
    await Promise.allSettled(leagueMembers.map(async member => {
        // 1. Send Email
        if (member.manager.email) {
            await sendMarketNotificationEmail(
                member.manager.email,
                listing.player.fullName,
                owningTeam.league.name,
                listing.player.fantasyPoints || 0,
                playerProfileUrl
            );
        }

        // 2. Create In-App Notification
        await createNotification(
            member.managerId,
            "MARKET_ALERT",
            "NEW ASSET DEPLOYED",
            `${listing.player.fullName} is now available in ${owningTeam.league.name}.`,
            `/market/${listing.id}/offer`
        );
    }));

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

    // 2.5 Check for Duplicate Offers (Same Players, Same Direction)
    // Prevent spamming the same offer while one is pending
    const existingDuplicateOffer = await prisma.tradeOffer.findFirst({
        where: {
            listingId: listingId,
            offererId: userId,
            offeredPlayerId: offeredPlayerId || null,
            status: "PENDING"
        }
    });

    if (existingDuplicateOffer) {
        throw new Error("You have already offered this specific player.");
    }

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

    // If no Yahoo context found, assume it's a local trade (or fallback)
    // Update Offer Status
    await prisma.tradeOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" }
    });

    // Update Listing Status
    await prisma.tradeListing.update({
        where: { id: offer.listingId },
        data: { status: "COMPLETED" }
    });

    // Reject all other offers for this listing
    await prisma.tradeOffer.updateMany({
        where: {
            listingId: offer.listingId,
            id: { not: offerId },
            status: "PENDING"
        },
        data: { status: "REJECTED" }
    });

    // Create Trade History Log
    await prisma.tradeHistory.create({
        data: {
            sellerId: offer.listing.sellerId,
            buyerId: offer.offererId,
            assetsGiven: {
                playerId: offer.listing.playerId,
                type: "PLAYER"
            },
            assetsReceived: {
                playerId: offer.offeredPlayerId,
                credits: offer.offeredCredits,
                type: "MIXED"
            }
        }
    });

    // Log Transaction
    // await logTrade(offer.listing.sellerId, "TRADE_ACCEPTED", `Trade accepted for ${offer.listingId}`);

    // Notify Offerer
    await createNotification(
        offer.offererId,
        "TRADE_ACCEPTED",
        "OFFER ACCEPTED",
        `Your offer for the listing has been accepted!`,
        `/trades`
    );

    revalidatePath("/market");
    revalidatePath("/trades");
    return { success: true };
} export async function rejectOffer(offerId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, message: "Unauthorized" };
    const userId = (session.user as any).id;

    const offer = await prisma.tradeOffer.findUnique({
        where: { id: offerId },
        include: {
            listing: {
                include: { player: true }
            }
        }
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

    // Notify Offerer
    await createNotification(
        offer.offererId,
        "TRADE_REJECTED",
        "OFFER REJECTED",
        `Your offer for ${offer.listing.player.fullName || 'a player'} has been rejected.`,
        `/trades`
    );

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
        include: {
            listing: {
                include: { player: true }
            }
        }
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

    // Notify Seller (Listing Owner)
    await createNotification(
        offer.listing.sellerId,
        "TRADE_CANCELLED",
        "OFFER WITHDRAWN",
        `An offer for ${offer.listing.player.fullName || 'your player'} has been withdrawn.`,
        `/trades`
    );

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

    // 2.5 Check for Duplicate Direct Offers
    const existingDuplicate = await prisma.tradeOffer.findFirst({
        where: {
            offererId: userId,
            status: "PENDING",
            offeredPlayerId: offeredPlayerId || null,
            listing: {
                playerId: targetPlayerId,
                status: "DIRECT_REQUEST"
            }
        }
    });

    if (existingDuplicate) {
        throw new Error("You have already offered this specific player for this target.");
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
        `/trades`
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
