"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- TYPES ---
interface CreateListingParams {
    teamId: string;
    playerId: string;
    lookingFor: string;
}

// --- ACTIONS ---

export async function createTradeListing({ teamId, playerId, lookingFor }: CreateListingParams) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) throw new Error("Unauthorized");

    // 1. Verify Ownership
    // Check if the team belongs to the user AND the player is in the team
    const team = await prisma.team.findFirst({
        where: {
            id: teamId,
            managerId: userId,
            players: {
                some: {
                    id: playerId
                }
            }
        }
    });

    if (!team) {
        throw new Error("You do not own this player or team.");
    }

    // 2. Create Trade Record
    await prisma.trade.create({
        data: {
            initiatorId: userId,
            scope: "MARKETPLACE",
            status: "OPEN",
            offeredAssets: [
                {
                    type: "PLAYER",
                    playerId: playerId,
                    teamId: teamId // Context: Which team is this player coming from?
                }
            ],
            requestedAssets: {
                description: lookingFor
            }
        }
    });

    revalidatePath("/market");
    return { success: true };
}

export async function getMarketplaceListings() {
    const trades = await prisma.trade.findMany({
        where: {
            scope: "MARKETPLACE",
            status: "OPEN"
        },
        include: {
            initiator: {
                select: {
                    username: true,
                    avatarUrl: true,
                    reputation: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // Enrich with Player Data
    // Since offeredAssets is JSON, we need to fetch the actual player details manually or map them.
    // For performance, let's fetch all referenced players in one go.

    const playerIds = trades.flatMap(t => (t.offeredAssets as any[]).map(a => a.playerId));

    const players = await prisma.player.findMany({
        where: {
            id: { in: playerIds }
        },
        include: {
            game: true
        }
    });

    const playerMap = new Map(players.map(p => [p.id, p]));

    return trades.map(trade => {
        const asset = (trade.offeredAssets as any[])[0]; // Assuming single player listing for now
        const player = playerMap.get(asset.playerId);

        return {
            ...trade,
            offeredPlayer: player,
            lookingFor: (trade.requestedAssets as any).description
        };
    });
}

export async function getUserRoster(teamId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
            players: true
        }
    });

    if (!team || team.managerId !== (session.user as any).id) {
        throw new Error("Team not found or unauthorized");
    }

    return team.players;
}

export async function getUserTeams() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return [];

    return await prisma.team.findMany({
        where: { managerId: userId },
        include: { league: true }
    });
}

export async function getPendingOffersCount() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return 0;

    const count = await prisma.trade.count({
        where: {
            targetUserId: userId,
            status: {
                in: ["OPEN", "NEGOTIATING"]
            }
        }
    });

    return count;
}

export async function getTradeDashboardData() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return null;

    const incoming = await prisma.trade.findMany({
        where: { targetUserId: userId },
        include: { initiator: true, targetUser: true },
        orderBy: { createdAt: 'desc' }
    });

    const outgoing = await prisma.trade.findMany({
        where: { initiatorId: userId },
        include: { initiator: true, targetUser: true },
        orderBy: { createdAt: 'desc' }
    });

    // Collect all player IDs from assets
    const playerIds = new Set<string>();
    
    const collectIds = (trades: any[]) => {
        trades.forEach(t => {
            const offered = t.offeredAssets as any[];
            const requested = t.requestedAssets as any[];
            offered?.forEach((a: any) => { if(a.type === 'PLAYER') playerIds.add(a.playerId); });
            requested?.forEach((a: any) => { if(a.type === 'PLAYER') playerIds.add(a.playerId); });
        });
    };

    collectIds(incoming);
    collectIds(outgoing);

    const players = await prisma.player.findMany({
        where: { id: { in: Array.from(playerIds) } }
    });

    return { incoming, outgoing, players };
}

export async function acceptOffer(tradeId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) throw new Error("Unauthorized");

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.targetUserId !== userId) throw new Error("Invalid trade");

    // Logic to execute trade (swap assets) would go here.
    // For now, just update status.
    await prisma.trade.update({
        where: { id: tradeId },
        data: { status: "ACCEPTED" }
    });

    revalidatePath("/trades");
    return { success: true };
}

export async function rejectOffer(tradeId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) throw new Error("Unauthorized");

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.targetUserId !== userId) throw new Error("Invalid trade");

    await prisma.trade.update({
        where: { id: tradeId },
        data: { status: "REJECTED" }
    });

    revalidatePath("/trades");
    return { success: true };
}

export async function cancelOffer(tradeId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) throw new Error("Unauthorized");

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.initiatorId !== userId) throw new Error("Invalid trade");

    await prisma.trade.update({
        where: { id: tradeId },
        data: { status: "CANCELLED" }
    });

    revalidatePath("/trades");
    return { success: true };
}
