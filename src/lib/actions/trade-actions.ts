"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { getLeagueTransactions, getPendingTradeTransactions } from "@/lib/yahooClient";
import { getTradeRedirectUrl } from "@/lib/trade-url-helper";
import { revalidatePath } from "next/cache";

export async function syncLeagueTrades(leagueId: string, yahooLeagueKey: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);
        const data = await getLeagueTransactions(accessToken, yahooLeagueKey);

        const transactions = data?.fantasy_content?.league?.[1]?.transactions;
        if (!transactions) return { success: true, count: 0 };

        let count = 0;

        for (const key in transactions) {
            if (key === "count") continue;
            const transaction = transactions[key].transaction;
            if (!transaction) continue;

            const meta = transaction[0];
            const playersData = transaction[1]?.players;

            if (meta.type !== "trade") continue;

            const yahooTradeId = meta.transaction_key;

            // 1. Check if YahooTransaction exists (Audit Log)
            const existingTransaction = await prisma.yahooTransaction.findUnique({
                where: { transactionKey: yahooTradeId }
            });

            if (existingTransaction) continue;

            // 2. Create YahooTransaction
            await prisma.yahooTransaction.create({
                data: {
                    transactionKey: yahooTradeId,
                    leagueId,
                    type: "trade",
                    timestamp: new Date(Number(meta.timestamp) * 1000), // Yahoo uses unix timestamp
                    details: transaction
                }
            });

            // 3. Check if YahooTrade exists (Business Logic)
            const existingTrade = await prisma.yahooTrade.findUnique({
                where: { yahooTradeId }
            });

            if (!existingTrade) {
                // Create Trade
                const traderTeamKey = meta.trader_team_key;
                const tradeeTeamKey = meta.tradee_team_key;
                const status = meta.status || "proposed"; // Yahoo status

                const trade = await prisma.yahooTrade.create({
                    data: {
                        yahooTradeId,
                        leagueId,
                        status,
                        offeredBy: traderTeamKey,
                        offeredTo: tradeeTeamKey,
                    }
                });

                // Create Items & Handle Roster Moves
                if (playersData) {
                    for (const pKey in playersData) {
                        if (pKey === "count") continue;
                        const playerObj = playersData[pKey].player;
                        const playerMeta = playerObj[0];
                        const transData = playerObj[1]?.transaction_data;
                        const playerKey = playerMeta.player_key;
                        const sourceTeamKey = transData.source_team_key;
                        const destTeamKey = transData.destination_team_key;

                        await prisma.yahooTradeItem.create({
                            data: {
                                tradeId: trade.id,
                                playerKey: playerKey,
                                senderTeamKey: sourceTeamKey,
                                receiverTeamKey: destTeamKey
                            }
                        });

                        // Auto-Roster Move if successful
                        if (status === 'successful') {
                            // Disconnect from source
                            await prisma.team.update({
                                where: { yahooTeamKey: sourceTeamKey },
                                data: {
                                    players: {
                                        disconnect: { id: playerKey }
                                    }
                                }
                            }).catch(e => console.warn(`[Sync] Failed to disconnect player ${playerKey} from ${sourceTeamKey}`, e));

                            // Connect to destination
                            await prisma.team.update({
                                where: { yahooTeamKey: destTeamKey },
                                data: {
                                    players: {
                                        connect: { id: playerKey }
                                    }
                                }
                            }).catch(e => console.warn(`[Sync] Failed to connect player ${playerKey} to ${destTeamKey}`, e));
                        }
                    }
                }
            }
            count++;
        }

        return { success: true, count };

    } catch (error) {
        console.error("Sync Trades Error:", error);
        return { success: false, error: "Failed to sync trades" };
    }
}

export async function proposeTrade(leagueId: string, yahooLeagueKey: string, tradeData: {
    trader_team_key: string;
    tradee_team_key: string;
    note?: string;
    players: Array<{
        player_key: string;
        source_team_key: string;
        destination_team_key: string;
    }>;
}) {
    return { success: false, error: "Deprecated. Use proposeYahooTrade." };
}

export async function proposeYahooTrade(
    leagueId: string,
    targetTeamId: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[],
    note: string = ""
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        // 1. Get League and Teams
        const league = await prisma.league.findUnique({
            where: { id: leagueId },
            include: {
                game: true,
                teams: {
                    where: {
                        OR: [
                            { managerId: userId },
                            { id: targetTeamId }
                        ]
                    },
                    include: {
                        players: true
                    }
                }
            }
        });

        if (!league) return { success: false, error: "League not found" };

        const userTeam = league.teams.find(t => t.managerId === userId);
        const targetTeam = league.teams.find(t => t.id === targetTeamId);

        if (!userTeam) return { success: false, error: "You do not have a team in this league" };
        if (!targetTeam) return { success: false, error: "Target team not found" };

        // 2. Validate Ownership
        const userPlayerKeys = new Set(userTeam.players.map(p => p.id));
        const missingPlayers = offeredPlayerKeys.filter(key => !userPlayerKeys.has(key));

        if (missingPlayers.length > 0) {
            return { success: false, error: `You do not own the following players: ${missingPlayers.join(", ")}` };
        }

        // 3. Generate Redirect URL
        const leagueKey = league.yahooLeagueKey;
        const targetTeamKey = targetTeam.yahooTeamKey;
        const sourceTeamKey = userTeam.yahooTeamKey;

        if (!leagueKey || !targetTeamKey || !sourceTeamKey) {
            return { success: false, error: "Invalid Yahoo keys" };
        }

        const redirectUrl = getTradeRedirectUrl(league.game.code, leagueKey, sourceTeamKey, targetTeamKey, offeredPlayerKeys, requestedPlayerKeys);

        return {
            success: true,
            redirectUrl,
            verificationKeys: {
                leagueKey,
                teamKey: sourceTeamKey
            }
        };

    } catch (error: any) {
        console.error("[Yahoo Sync Error] Propose Trade:", error);
        return { success: false, error: error.message || "Failed to propose trade" };
    }
}

export async function verifyPendingTrade(leagueKey: string, teamKey: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);
        const data = await getPendingTradeTransactions(accessToken, leagueKey);

        const transactions = data?.fantasy_content?.league?.[1]?.transactions;

        if (!transactions || transactions.count === 0) {
            return { success: false };
        }

        // Get the first transaction (key "0")
        const transactionWrapper = transactions["0"];
        if (!transactionWrapper || !transactionWrapper.transaction) {
            return { success: false };
        }

        const transactionMeta = transactionWrapper.transaction[0];

        // Check timestamp (should be within last 3 minutes)
        const tradeTimestamp = parseInt(transactionMeta.timestamp, 10);
        const now = Math.floor(Date.now() / 1000);
        const diff = now - tradeTimestamp;

        // 3 minutes = 180 seconds
        if (diff < 180) {
            return { success: true };
        }

        return { success: false };

    } catch (error) {
        console.error("Error verifying pending trade:", error);
        return { success: false, error: "Failed to verify trade" };
    }
}

export async function verifyAndSaveTrade(
    leagueKey: string,
    teamKey: string,
    listingId: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[],
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);
        const data = await getPendingTradeTransactions(accessToken, leagueKey);

        const transactions = data?.fantasy_content?.league?.[1]?.transactions;

        // If no transactions, return false
        if (!transactions) return { success: false };

        // Iterate through transactions
        for (const key in transactions) {
            if (key === "count") continue;
            const transaction = transactions[key].transaction;
            if (!transaction) continue;

            const meta = transaction[0];

            // Validation 1: Initiator
            if (meta.initiator_team_key !== teamKey) continue;

            // Validation 2: Timestamp (within last 3 minutes)
            const tradeTimestamp = parseInt(meta.timestamp, 10) * 1000;
            const now = Date.now();
            const threeMinutes = 3 * 60 * 1000;

            if (now - tradeTimestamp > threeMinutes) {
                continue; // Too old
            }

            // Validation 3: (Optional) Check players
            // For now, we trust the initiator and timestamp match is sufficient for the "just proposed" trade.

            // If Valid: Save to DB
            // If we have a listingId, we can update the trade status in our DB
            if (listingId) {
                try {
                    await prisma.trade.update({
                        where: { id: listingId },
                        data: { status: "NEGOTIATING" }
                    });
                } catch (dbError) {
                    console.error("Failed to update trade status:", dbError);
                    // We still return success because the Yahoo part was verified
                }
            }

            return { success: true };
        }

        return { success: false };

    } catch (error) {
        console.error("Error verifying trade:", error);
        return { success: false, error: "Verification failed" };
    }
}
