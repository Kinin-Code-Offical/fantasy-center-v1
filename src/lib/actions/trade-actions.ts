"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { getLeagueTransactions, postTradeToYahoo } from "@/lib/yahooClient";
import { XMLParser } from "fast-xml-parser";
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

            // Check if exists
            const existing = await prisma.yahooTrade.findUnique({
                where: { yahooTradeId }
            });

            if (existing) continue;

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

            // Create Items
            if (playersData) {
                for (const pKey in playersData) {
                    if (pKey === "count") continue;
                    const playerObj = playersData[pKey].player;
                    const playerMeta = playerObj[0];
                    const transData = playerObj[1]?.transaction_data;

                    await prisma.yahooTradeItem.create({
                        data: {
                            tradeId: trade.id,
                            playerKey: playerMeta.player_key,
                            senderTeamKey: transData.source_team_key,
                            receiverTeamKey: transData.destination_team_key
                        }
                    });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);
        
        // 1. Post to Yahoo
        const xmlResponse = await postTradeToYahoo(accessToken, yahooLeagueKey, tradeData);
        
        // 2. Parse Response to get Transaction Key
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlResponse);
        const transactionKey = jsonObj?.fantasy_content?.transaction?.transaction_key;

        if (!transactionKey) {
            throw new Error("Failed to get transaction key from Yahoo response");
        }

        // 3. Save to DB
        const trade = await prisma.yahooTrade.create({
            data: {
                yahooTradeId: transactionKey,
                leagueId,
                status: "proposed",
                offeredBy: tradeData.trader_team_key,
                offeredTo: tradeData.tradee_team_key,
                items: {
                    create: tradeData.players.map(p => ({
                        playerKey: p.player_key,
                        senderTeamKey: p.source_team_key,
                        receiverTeamKey: p.destination_team_key
                    }))
                }
            }
        });

        revalidatePath(`/league/${leagueId}`);
        return { success: true, tradeId: trade.id };

    } catch (error) {
        console.error("Propose Trade Error:", error);
        return { success: false, error: "Failed to propose trade" };
    }
}
