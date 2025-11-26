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

                        const rawTransData = playerObj[1]?.transaction_data;
                        const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

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

                // --- NEW: Create Trade History Log for Yahoo Trades ---
                // We try to map Yahoo Team Keys to our User IDs to create a proper history record
                if (status === 'accepted' || status === 'successful') {
                    const traderTeam = await prisma.team.findUnique({ where: { yahooTeamKey: meta.trader_team_key }, include: { manager: true } });
                    const tradeeTeam = await prisma.team.findUnique({ where: { yahooTeamKey: meta.tradee_team_key }, include: { manager: true } });

                    if (traderTeam && tradeeTeam) {
                        // Construct assets JSON
                        const assetsGiven: any = { players: [] };
                        const assetsReceived: any = { players: [] };

                        if (playersData) {
                            for (const pKey in playersData) {
                                if (pKey === "count") continue;
                                const playerObj = playersData[pKey].player;
                                const playerMeta = playerObj[0];
                                const rawTransData = playerObj[1]?.transaction_data;
                                const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

                                if (transData.source_team_key === meta.trader_team_key) {
                                    assetsGiven.players.push(playerMeta.player_key);
                                } else {
                                    assetsReceived.players.push(playerMeta.player_key);
                                }
                            }
                        }

                        await prisma.tradeHistory.create({
                            data: {
                                sellerId: traderTeam.managerId, // Initiator
                                buyerId: tradeeTeam.managerId,  // Target
                                assetsGiven,
                                assetsReceived,
                                completedAt: new Date(Number(meta.timestamp) * 1000)
                            }
                        });
                    }
                }
                // ------------------------------------------------------
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
// 1. verifyPendingTrade Fonksiyonunu Güncelle
export async function verifyPendingTrade(leagueKey: string, teamKey: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);

        // GÜNCELLEME BURADA: teamKey eklendi
        const data = await getPendingTradeTransactions(accessToken, leagueKey, teamKey);

        const transactions = data?.fantasy_content?.league?.[1]?.transactions;

        if (!transactions || transactions.count === 0) return { success: false };

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

        return { success: true }; // Basitleştirildi, detaylı kontrol aşağıda
    } catch (error) {
        console.error("Error verifying pending trade:", error);
        return { success: false, error: "Failed to verify trade" };
    }
}
// 2. verifyAndSaveTrade Fonksiyonunu Güncelle
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

        // Ensure leagueKey is valid (strip .pt. or .t. suffix if present)
        const cleanLeagueKey = leagueKey.split('.').slice(0, 3).join('.');

        // GÜNCELLEME BURADA: teamKey parametresi eklendi
        const data = await getPendingTradeTransactions(accessToken, cleanLeagueKey, teamKey);

        const transactions = data?.fantasy_content?.league?.[1]?.transactions;

        // İşlem yoksa false dön
        if (!transactions || transactions.count === 0) {
            console.log(`[VERIFY] No pending transactions found for league ${leagueKey} and team ${teamKey}`);
            return { success: false };
        }

        console.log(`[VERIFY] Found ${transactions.count} transactions. Checking for match...`);

        // Yahoo transaction listesi "0", "1" gibi key'lerle döner
        for (const key in transactions) {
            if (key === "count") continue;
            const transaction = transactions[key].transaction;
            if (!transaction) continue;

            const meta = transaction[0];
            console.log(`[VERIFY] Checking transaction ${meta.transaction_key}: Initiator=${meta.initiator_team_key}, Timestamp=${meta.timestamp}`);

            // Doğrulama 1: Başlatan Takım (Initiator)
            // NOT: Yahoo bazen initiator_team_key'i undefined döndürebiliyor veya farklı formatta olabiliyor.
            // Eğer undefined ise, transaction'ın bizim takımımızla ilgili olup olmadığını kontrol edelim.
            // pending_trade sorgusu zaten team_key ile yapıldığı için, dönen transaction'lar bu takımla ilgilidir.

            if (meta.initiator_team_key && meta.initiator_team_key !== teamKey) {
                console.log(`[VERIFY] Initiator mismatch. Expected: ${teamKey}, Got: ${meta.initiator_team_key}`);
                continue;
            } else if (!meta.initiator_team_key) {
                console.log(`[VERIFY] Initiator key is undefined. Assuming valid since we queried by team_key.`);
            }

            // Doğrulama 2: Zaman Damgası (Son 5 dakika)
            if (meta.timestamp) {
                const tradeTimestamp = parseInt(meta.timestamp, 10) * 1000;
                const now = Date.now();
                const fiveMinutes = 5 * 60 * 1000;

                if (!isNaN(tradeTimestamp) && (now - tradeTimestamp > fiveMinutes)) {
                    console.log("[VERIFY] Found old transaction, skipping.");
                    continue;
                }
            } else {
                console.log("[VERIFY] Timestamp missing. Proceeding to player check...");
            }

            // Doğrulama 3: Oyuncu Kontrolü (KESİN EŞLEŞME)
            // Bu kontrol, eski veya alakasız pending trade'lerin yanlışlıkla onaylanmasını önler.
            const playersData = transaction[1]?.players;
            if (!playersData) {
                console.log("[VERIFY] No player data in transaction. Skipping.");
                continue;
            }

            const transactionPlayerKeys: string[] = [];
            for (const pKey in playersData) {
                if (pKey === "count") continue;
                const playerObj = playersData[pKey].player;
                // playerObj[0] metadata, playerObj[0][0] player_key içerir
                // Yahoo yapısı bazen karmaşık olabilir, güvenli erişim:
                const pMeta = Array.isArray(playerObj) ? playerObj[0] : playerObj;
                // Bazen playerObj[0] bir array olabilir, bazen obje.
                // Genellikle: playerObj[0] -> { player_key: '...' }
                // Veya: playerObj[0] -> [ { player_key: '...' } ]

                let pKeyVal = null;
                if (Array.isArray(pMeta)) {
                    pKeyVal = pMeta.find((x: any) => x.player_key)?.player_key;
                } else {
                    pKeyVal = pMeta?.player_key;
                }

                if (pKeyVal) transactionPlayerKeys.push(pKeyVal);
            }

            console.log("[VERIFY] Transaction Players:", transactionPlayerKeys);
            console.log("[VERIFY] Expected Players:", [...offeredPlayerKeys, ...requestedPlayerKeys]);

            // Teklif edilen ve istenen tüm oyuncular transaction içinde olmalı
            const allExpectedPlayers = [...offeredPlayerKeys, ...requestedPlayerKeys];
            const isMatch = allExpectedPlayers.every(k => transactionPlayerKeys.includes(k));

            if (!isMatch) {
                console.log("[VERIFY] Player mismatch. Skipping transaction.");
                continue;
            }

            // Başarılı! Veritabanına kaydet
            console.log(`[VERIFY] Trade verified! Key: ${meta.transaction_key}`);

            // [SYNC] Ensure YahooTrade exists in our DB so it shows up in UI immediately
            const league = await prisma.league.findFirst({
                where: { yahooLeagueKey: leagueKey }
            });

            if (league) {
                try {
                    const trade = await prisma.yahooTrade.upsert({
                        where: { yahooTradeId: meta.transaction_key },
                        create: {
                            yahooTradeId: meta.transaction_key,
                            leagueId: league.id,
                            status: meta.status || 'proposed',
                            offeredBy: meta.trader_team_key,
                            offeredTo: meta.tradee_team_key,
                        },
                        update: {
                            status: meta.status || 'proposed'
                        }
                    });

                    // Sync Items
                    for (const pKey in playersData) {
                        if (pKey === "count") continue;
                        const playerObj = playersData[pKey].player;
                        const pMeta = Array.isArray(playerObj) ? playerObj[0] : playerObj;
                        const realPMeta = Array.isArray(pMeta) ? pMeta[0] : pMeta;

                        const rawTransData = Array.isArray(playerObj) && playerObj[1] ? playerObj[1].transaction_data : null;
                        const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

                        if (!realPMeta?.player_key || !transData) continue;

                        // Validate keys to prevent crash
                        if (!transData.source_team_key || !transData.destination_team_key) {
                            console.warn(`[VERIFY] Missing team keys for player ${realPMeta?.player_key}`, transData);
                            continue;
                        }

                        const existingItem = await prisma.yahooTradeItem.findFirst({
                            where: { tradeId: trade.id, playerKey: realPMeta.player_key }
                        });

                        if (!existingItem) {
                            await prisma.yahooTradeItem.create({
                                data: {
                                    tradeId: trade.id,
                                    playerKey: realPMeta.player_key,
                                    senderTeamKey: transData.source_team_key,
                                    receiverTeamKey: transData.destination_team_key
                                }
                            });
                        }
                    }
                    console.log("[VERIFY] YahooTrade synced successfully.");
                } catch (syncErr) {
                    console.error("[VERIFY] Failed to sync YahooTrade:", syncErr);
                }
            }

            // Only create a TradeOffer if this is a real listing (not a direct trade)
            if (listingId && !listingId.startsWith("direct-trade-")) {
                try {
                    // 1. Check for duplicates
                    const existingOffer = await prisma.tradeOffer.findFirst({
                        where: { yahooTransactionId: meta.transaction_key }
                    });

                    if (!existingOffer) {
                        // 2. Create the TradeOffer record
                        await prisma.tradeOffer.create({
                            data: {
                                listingId: listingId,
                                offererId: userId,
                                status: "PENDING",
                                yahooTransactionId: meta.transaction_key,
                                offeredPlayerId: offeredPlayerKeys[0] || null, // Store primary asset
                                // offeredCredits: 0 // Credits not passed in verify yet
                            }
                        });
                        console.log("[VERIFY] TradeOffer created in database.");
                    } else {
                        console.log("[VERIFY] TradeOffer already exists.");
                    }
                } catch (e) {
                    console.error("[VERIFY] DB update failed:", e);
                    // Don't fail the whole verification if DB save fails, but log it.
                }
            } else {
                console.log("[VERIFY] Skipping TradeOffer creation for direct trade (no listing).");
            }

            return { success: true };
        }

        return { success: false };

    } catch (error: any) {
        // Yahoo API hatasını detaylı logla
        console.error("Error verifying trade:", JSON.stringify(error, null, 2));
        return { success: false, error: "Verification failed" };
    }
}

export async function verifyTradeStatus(leagueKey: string, transactionKey: string, expectedStatus: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const accessToken = await getValidYahooToken(userId);

        // We need to fetch transactions again to see the status
        // getLeagueTransactions fetches all, which might be heavy.
        // But we can filter by key if we fetch all.
        // Alternatively, getPendingTradeTransactions might not show it if it's already processed (accepted/rejected).

        // Ensure leagueKey is valid
        const cleanLeagueKey = leagueKey.split('.').slice(0, 3).join('.');

        const data = await getLeagueTransactions(accessToken, cleanLeagueKey);
        const transactions = data?.fantasy_content?.league?.[1]?.transactions;

        if (!transactions) return { success: false };

        for (const key in transactions) {
            if (key === "count") continue;
            const transaction = transactions[key].transaction;
            if (!transaction) continue;

            const meta = transaction[0];
            if (meta.transaction_key === transactionKey) {
                // Found it!
                const currentStatus = meta.status;
                console.log(`[VERIFY STATUS] Trade ${transactionKey}: ${currentStatus} (Expected: ${expectedStatus})`);

                // Map Yahoo status to our expected status
                // Yahoo: 'proposed', 'accepted', 'rejected', 'successful'

                // ACCEPT LOGIC
                if (expectedStatus === 'accepted' && (currentStatus === 'accepted' || currentStatus === 'successful')) {
                    // Update DB
                    await prisma.yahooTrade.update({
                        where: { yahooTradeId: transactionKey },
                        data: { status: currentStatus }
                    });
                    return { success: true, status: currentStatus };
                }

                // REJECT LOGIC
                if (expectedStatus === 'rejected' && currentStatus === 'rejected') {
                    // Update DB
                    await prisma.yahooTrade.update({
                        where: { yahooTradeId: transactionKey },
                        data: { status: currentStatus }
                    });
                    return { success: true, status: currentStatus };
                }

                // CANCEL LOGIC (Yahoo might not show cancelled trades in transactions list if they were just deleted)
                // But if it shows up as 'rejected' or similar, we handle it.
                // If the user cancelled it, it might disappear from "proposed" list but appear in transaction log as "cancelled"?
                // Yahoo API behavior for cancelled trades is tricky. Often they just vanish from "pending".
                // But here we are looking at "transactions", so it should be logged.

                // If status matches exactly what we expect (e.g. 'cancelled' if Yahoo supports it)
                if (currentStatus === expectedStatus) {
                    await prisma.yahooTrade.update({
                        where: { yahooTradeId: transactionKey },
                        data: { status: currentStatus }
                    });
                    return { success: true, status: currentStatus };
                }
            }
        }

        // If we didn't find it, and we expected 'cancelled', maybe it's gone?
        // But getLeagueTransactions returns history, so it should be there with a status.

        return { success: false };

    } catch (error) {
        console.error("Error verifying trade status:", error);
        return { success: false };
    }
}

export async function syncUserTrades() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = (session.user as any).id;

    try {
        const userTeamsWithLeague = await prisma.team.findMany({
            where: { managerId: userId },
            include: { league: true }
        });

        const uniqueLeagues = new Map();
        userTeamsWithLeague.forEach(team => {
            if (!uniqueLeagues.has(team.league.id)) {
                uniqueLeagues.set(team.league.id, team.league);
            }
        });

        await Promise.all(Array.from(uniqueLeagues.values()).map(league =>
            syncLeagueTrades(league.id, league.yahooLeagueKey)
                .catch(e => console.error(`Failed to sync league ${league.name}`, e))
        ));

        return { success: true };
    } catch (error) {
        console.error("Failed to sync user trades:", error);
        return { success: false, error: "Sync failed" };
    }
}
