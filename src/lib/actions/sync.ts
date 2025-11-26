"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { getFullUserStats, getTeamRoster, getPlayerNews, getLeagueTransactions, getPendingTradeTransactions } from "@/lib/yahooClient";
import { fetchAndProcessNews } from "@/lib/rss";
import { revalidatePath } from "next/cache";

// Helper to extract team data from Yahoo's mixed array structure
function extractYahooTeamData(teamObj: any) {
    const teamDataArray = teamObj.team[0];
    if (!Array.isArray(teamDataArray)) return null;

    const getVal = (key: string) => {
        const item = teamDataArray.find((x: any) => x.hasOwnProperty(key));
        return item ? item[key] : undefined;
    };

    const teamKey = getVal("team_key");
    const name = getVal("name");

    // Extract Logo
    // Yahoo structure: team_logos -> [ { size: 'medium', url: '...' }, ... ]
    let logoUrl = null;

    // 1. Try standard getVal
    let teamLogos = getVal("team_logos");

    // 2. If not found, search explicitly in the array
    if (!teamLogos) {
        const logoEntry = teamDataArray.find((x: any) => x.team_logos);
        if (logoEntry) teamLogos = logoEntry.team_logos;
    }

    if (Array.isArray(teamLogos)) {
        if (teamLogos[0]?.team_logo?.url) {
            logoUrl = teamLogos[0].team_logo.url;
        } else {
            logoUrl = teamLogos[0]?.url;
        }
    } else if (teamLogos && Array.isArray(teamLogos.team_logo)) {
        logoUrl = teamLogos.team_logo[0]?.url;
    } else if (teamLogos && teamLogos.team_logo && teamLogos.team_logo.url) {
        logoUrl = teamLogos.team_logo.url;
    }

    // Standings are usually in the second element of the main team array, or nested differently
    // But based on typical structure, let's look for team_standings in the same array or the next one
    // Actually, team_standings is often in teamObj.team[2] or similar. 
    // Let's try to find it in the main array first.
    let standings = getVal("team_standings");

    // If not found in the first array, check the second element of the parent array (teamObj.team[1] is usually roster or standings)
    if (!standings && teamObj.team[1] && teamObj.team[1].team_standings) {
        standings = teamObj.team[1].team_standings;
    }

    return {
        teamKey,
        name,
        logoUrl,
        wins: parseInt(standings?.outcome_totals?.wins || "0"),
        losses: parseInt(standings?.outcome_totals?.losses || "0"),
        ties: parseInt(standings?.outcome_totals?.ties || "0"),
        rank: parseInt(standings?.rank || "0"),
    };
}

import { createNotification } from "./notifications";

export async function syncUserLeagues() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // 1. Get Valid Token (Handles refresh if expired by time)
        const accessToken = await getValidYahooToken(userId);

        // 2. Fetch Data from Yahoo
        console.log("Fetching full user stats from Yahoo...");
        const data = await getFullUserStats(accessToken);

        const games = data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
        if (!games) {
            return { success: false, message: "No games found" };
        }

        // 3. Process and Save Data
        for (const gameKey in games) {
            if (gameKey === "count") continue;
            const gameObj = games[gameKey];
            const gameMeta = gameObj.game[0];
            const leagues = gameObj.game[1]?.leagues;

            if (!leagues) continue;

            // Upsert Game
            await prisma.game.upsert({
                where: { id: gameMeta.game_key },
                create: {
                    id: gameMeta.game_key,
                    code: gameMeta.code,
                    season: parseInt(gameMeta.season),
                },
                update: {
                    season: parseInt(gameMeta.season),
                }
            });

            // Iterate Leagues
            for (const leagueKey in leagues) {
                if (leagueKey === "count") continue;
                const leagueObj = leagues[leagueKey];
                const leagueMeta = leagueObj.league[0];
                const teams = leagueObj.league[1]?.teams;

                if (!teams) continue;

                // Upsert League
                const league = await prisma.league.upsert({
                    where: { yahooLeagueKey: leagueMeta.league_key },
                    create: {
                        yahooLeagueKey: leagueMeta.league_key,
                        gameId: gameMeta.game_key,
                        name: leagueMeta.name,
                        numTeams: parseInt(leagueMeta.num_teams),
                        scoringType: leagueMeta.scoring_type,
                        currentWeek: parseInt(leagueMeta.current_week || "1"),
                    },
                    update: {
                        name: leagueMeta.name,
                        numTeams: parseInt(leagueMeta.num_teams),
                        scoringType: leagueMeta.scoring_type,
                        currentWeek: parseInt(leagueMeta.current_week || "1"),
                        lastSync: new Date(),
                    }
                });

                // Sync Transactions
                await syncLeagueTransactions(accessToken, leagueMeta.league_key, league.id);

                // Iterate Teams
                for (const teamKey in teams) {
                    if (teamKey === "count") continue;
                    const teamObj = teams[teamKey];

                    // Use helper to extract data safely
                    const teamData = extractYahooTeamData(teamObj);

                    if (!teamData || !teamData.teamKey) {
                        console.warn("Skipping team due to missing key:", teamObj);
                        continue;
                    }

                    console.log(`[Sync] Team: ${teamData.name}, Logo Found: ${teamData.logoUrl}`);

                    // Upsert Team
                    await prisma.team.upsert({
                        where: { yahooTeamKey: teamData.teamKey },
                        create: {
                            yahooTeamKey: teamData.teamKey,
                            league: { connect: { yahooLeagueKey: leagueMeta.league_key } },
                            manager: { connect: { id: userId } },
                            name: teamData.name,
                            logoUrl: teamData.logoUrl,
                            wins: teamData.wins,
                            losses: teamData.losses,
                            ties: teamData.ties,
                            rank: teamData.rank,
                        },
                        update: {
                            name: teamData.name,
                            logoUrl: teamData.logoUrl,
                            wins: teamData.wins,
                            losses: teamData.losses,
                            ties: teamData.ties,
                            rank: teamData.rank,
                        }
                    });

                    // Sync Roster for this team
                    await syncTeamRosterInternal(teamData.teamKey, accessToken, teamData.name, teamData.logoUrl);

                    // Sync Pending Trades
                    await syncPendingTradesForTeam(accessToken, leagueMeta.league_key, teamData.teamKey, league.id);
                }
            }
        }

        await createNotification(userId, "SYSTEM", "SYNC COMPLETE", "Yahoo data pipeline updated successfully.");

        // Sync News
        await syncPlayerNews();

        revalidatePath("/dashboard");
        return { success: true, message: "Sync complete" };

    } catch (error: any) {
        console.error("Sync failed:", error);
        return { success: false, message: error.message };
    }
}

async function syncTeamRosterInternal(teamKey: string, accessToken: string, teamName: string, teamLogoUrl: string | null) {
    try {
        // Fetch Week Stats (Default)
        const data = await getTeamRoster(accessToken, teamKey);

        // Fetch Season Stats (For Projections Fallback)
        const dataSeason = await getTeamRoster(accessToken, teamKey, "season");
        const seasonStatsMap = new Map<string, any>();

        try {
            const sTeamData = dataSeason?.fantasy_content?.team;
            const sRosterWrapper = sTeamData?.[1]?.roster;
            const sPlayersWrapper = sRosterWrapper?.["0"]?.players;

            if (sPlayersWrapper) {
                const sCount = sPlayersWrapper.count;
                for (let i = 0; i < sCount; i++) {
                    const pObj = sPlayersWrapper[i.toString()].player;
                    const pMeta = pObj[0];
                    const pKey = pMeta.find((x: any) => x.player_key)?.player_key;
                    if (pKey) {
                        seasonStatsMap.set(pKey, pObj);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse season stats map", e);
        }

        const teamData = data.fantasy_content?.team;
        if (!teamData) return;

        const rosterWrapper = teamData[1]?.roster;
        const playersWrapper = rosterWrapper?.["0"]?.players;

        if (!playersWrapper) return;

        const playerCount = playersWrapper.count;

        // 1. ADIM: Güncel kadrodaki tüm oyuncu ID'lerini tutacağımız dizi
        const currentRosterIds: string[] = [];

        for (let i = 0; i < playerCount; i++) {
            try {
                const playerObj = playersWrapper[i.toString()].player;
                const playerMeta = playerObj[0];

                const getField = (arr: any[], key: string) => arr.find((x: any) => x.hasOwnProperty(key))?.[key];
                const playerKey = getField(playerMeta, "player_key");
                const name = getField(playerMeta, "name");
                const editorialTeam = getField(playerMeta, "editorial_team_abbr");
                const headshot = getField(playerMeta, "primary_position");
                const primaryPos = getField(playerMeta, "status"); // e.g. "Q", "O", "IR"

                // --- STATS & METRICS ---
                const STAT_MAP: Record<string, string> = { "12": "pts", "15": "reb", "16": "ast", "19": "st", "20": "blk" };
                let percentOwned = 0;
                let percentStarted = 0;
                let statsJson: any = {};
                let opponent = null;

                try {
                    // Percent Owned
                    const pOwnedEntry = playerObj.find((x: any) => x.percent_owned);
                    if (pOwnedEntry) {
                        const po = pOwnedEntry.percent_owned;
                        // Usually array: [ {value: 96}, {coverage_type: 'week', value: 80} ]
                        // First one is usually % Owned, second is % Started (if coverage_type is week)
                        if (Array.isArray(po)) {
                            percentOwned = parseFloat(po[0]?.value || "0");
                            // Try to find week coverage for started
                            const started = po.find((x: any) => x.coverage_type === 'week');
                            if (started) percentStarted = parseFloat(started.value || "0");
                        }
                    }

                    // Stats
                    const statsWrapper = playerObj.find((x: any) => x.player_stats);
                    if (statsWrapper && statsWrapper.player_stats && Array.isArray(statsWrapper.player_stats.stats)) {
                        statsWrapper.player_stats.stats.forEach((s: any) => {
                            const id = s.stat.stat_id;
                            const val = s.stat.value;
                            if (STAT_MAP[id] && val !== '-' && val !== undefined) {
                                statsJson[STAT_MAP[id]] = val;
                            }
                        });
                    }
                } catch (e) {
                    console.warn(`Error extracting stats for ${name?.full}`, e);
                }

                // Extract Points Logic
                let fantasyPoints = 0;
                let projectedPoints = 0;

                // 1. Find all 'player_points' objects in the array
                const allPointsObjs = playerObj.filter((x: any) => x.player_points).map((x: any) => x.player_points);

                // 2. Iterate to find actual and projected
                if (allPointsObjs.length > 0) {
                    // Usually the first one is actual
                    const p1 = allPointsObjs[0];
                    if (p1.total) fantasyPoints = parseFloat(p1.total);

                    // Check for coverage type to distinguish
                    // e.g. coverage_type: "week", week: "5"
                }

                // 3. Look for Projected (Green Numbers)
                // If actual is 0, we look for any other value or specific coverage
                if (fantasyPoints === 0) {
                    for (const p of allPointsObjs) {
                        const val = parseFloat(p.total);
                        if (val > 0) {
                            // If we found a positive value and actual was 0, assume this is the projection
                            projectedPoints = val;
                            fantasyPoints = val; // Use projection as current points for display if actual is 0
                            break;
                        }
                    }
                }

                // 4. Fallback: Check player_stats (Projection Hunting)
                if (fantasyPoints === 0) {
                    // Yahoo stores projections in 'player_stats' with coverage_type = 'prediction'
                    // Search through the player array parts to find 'player_stats'
                    const statsObj = playerObj.find((p: any) => p.player_stats);

                    if (statsObj) {
                        const ps = statsObj.player_stats;
                        if (Array.isArray(ps)) {
                            // Look for the stats object that is a PREDICTION
                            const predictionStat = ps.find((s: any) => s.coverage_type === 'prediction' || s.coverage_type === 'projected');

                            if (predictionStat && predictionStat.player_points) {
                                const val = parseFloat(predictionStat.player_points.total || "0");
                                if (val > 0) {
                                    projectedPoints = val;
                                    fantasyPoints = val;
                                }
                            }
                        }
                    }
                }                // 5. Last Resort: Season Average
                if (fantasyPoints === 0) {
                    // Try to get season stats from the map
                    let seasonStatsWrapper = null;
                    const seasonPlayerObj = seasonStatsMap.get(playerKey);

                    if (seasonPlayerObj) {
                        seasonStatsWrapper = seasonPlayerObj.find((x: any) => x.player_stats && x.player_stats.coverage_type === 'season');
                    }

                    // Fallback to existing logic if map failed (unlikely)
                    if (!seasonStatsWrapper) {
                        seasonStatsWrapper = playerObj.find((x: any) => x.player_stats && x.player_stats.coverage_type === 'season');
                    }

                    if (seasonStatsWrapper && seasonStatsWrapper.player_stats && seasonStatsWrapper.player_stats.stats) {
                        const stats = seasonStatsWrapper.player_stats.stats;
                        // Try to find Total Fantasy Points (9004003) and GP (0)
                        // Note: GP might not be in stats list if not configured in league settings.
                        // But usually Total Points is there.
                        // If GP is missing, we can't calculate average.

                        const fanPtsStat = stats.find((s: any) => s.stat.stat_id === "9004003");
                        // Try to find GP (Stat ID 0)
                        // If not found, maybe we can use Games Played from another source?
                        // But for now, rely on Stat ID 0.
                        const gpStat = stats.find((s: any) => s.stat.stat_id === "0");

                        if (fanPtsStat && gpStat) {
                            const total = parseFloat(fanPtsStat.stat.value);
                            const gp = parseFloat(gpStat.stat.value);
                            if (!isNaN(total) && !isNaN(gp) && gp > 0) {
                                const avg = total / gp;
                                projectedPoints = parseFloat(avg.toFixed(1));
                                fantasyPoints = projectedPoints;
                            }
                        }
                    }
                }

                // Calculate Market Value
                // Formula: (Points * 300,000)
                // Example: 50 points -> $15,000,000
                const basePoints = projectedPoints || fantasyPoints || 5;
                let marketValue = basePoints * 300000;

                // Injury Adjustment
                if (primaryPos === 'O' || primaryPos === 'INJ') {
                    marketValue = marketValue * 0.5;
                }

                marketValue = Math.round(marketValue);

                console.log(`[SYNC SUCCESS] Team: ${teamName} | Logo: ${teamLogoUrl} | Player: ${name?.full} (${fantasyPoints} pts) | Value: ${marketValue}`);

                if (!playerKey) continue;

                // Upsert Player
                // 2. ADIM: Oyuncuyu veritabanına kaydet/güncelle (Upsert)
                // Oyuncu veritabanında yoksa "connect" işlemi hata verir, bu yüzden önce upsert şart.
                const player = await prisma.player.upsert({
                    where: { id: playerKey },
                    create: {
                        id: playerKey,
                        gameId: playerKey.split('.')[0],
                        fullName: name?.full || "Unknown",
                        editorialTeam: editorialTeam,
                        photoUrl: headshot?.url,
                        primaryPos: primaryPos,
                        status: primaryPos,
                        fantasyPoints: fantasyPoints,
                        projectedPoints: projectedPoints,
                        percentOwned: percentOwned,
                        percentStarted: percentStarted,
                        marketValue: marketValue,
                        opponent: opponent,
                        stats: statsJson
                    },
                    update: {
                        fullName: name?.full || "Unknown",
                        editorialTeam: editorialTeam,
                        photoUrl: headshot?.url,
                        primaryPos: primaryPos,
                        status: primaryPos,
                        fantasyPoints: fantasyPoints,
                        projectedPoints: projectedPoints,
                        percentOwned: percentOwned,
                        percentStarted: percentStarted,
                        marketValue: marketValue,
                        opponent: opponent,
                        stats: statsJson
                    }
                });

                // 3. ADIM: Bu oyuncunun ID'sini listeye ekle
                if (player) {
                    currentRosterIds.push(player.id);
                }


            } catch (innerError) {
                console.error(`Error processing player index ${i} for team ${teamKey}`, innerError);
            }
        }
        // 4. ADIM: Takım kadrosunu TOPLU GÜNCELLE (Kritik Düzeltme)
        // 'set' komutu, ilişkili oyuncuları tam olarak bu listeye eşitler.
        // Listede olmayan (eski) oyuncular otomatik olarak boşa çıkar (disconnect olur).
        if (currentRosterIds.length > 0) {
            await prisma.team.update({
                where: { yahooTeamKey: teamKey },
                data: {
                    players: {
                        set: currentRosterIds.map(id => ({ id }))
                    }
                }
            });
            console.log(`[ROSTER SYNC] Team ${teamName} roster updated. Count: ${currentRosterIds.length}`);
        }

    } catch (error) {
        console.error(`Failed to sync roster for team ${teamKey}`, error);
    }
}

export async function syncPlayerNews() {
    // 1. Identify Priority Players
    // Fetch all followed players
    const follows = await prisma.playerFollow.findMany({
        select: { playerId: true }
    });

    // Fetch all players in user teams
    const teams = await prisma.team.findMany({
        select: {
            players: {
                select: { id: true }
            }
        }
    });

    const playerIds = new Set<string>();
    follows.forEach(f => playerIds.add(f.playerId));
    teams.forEach(t => t.players.forEach(p => playerIds.add(p.id)));

    if (playerIds.size === 0) {
        return { success: true, message: "No players to sync." };
    }

    const uniquePlayerIds = Array.from(playerIds);
    console.log(`Syncing news for ${uniquePlayerIds.length} players...`);

    // Fetch full player objects for name matching
    const priorityPlayers = await prisma.player.findMany({
        where: { id: { in: uniquePlayerIds } }
    });

    // 2. Fetch News via RSS
    console.time("NewsSync");
    const newsCount = await fetchAndProcessNews(priorityPlayers);
    console.timeEnd("NewsSync");

    console.log(`[RSS INTEL] Processed news feed. Found ${newsCount} relevant articles.`);
    return { success: true, count: newsCount };
}

export async function syncLeagueTransactions(accessToken: string, leagueKey: string, leagueId: string) {
    console.log(`[SYNC] Checking transactions for league ${leagueKey}...`);
    const transactionsData = await getLeagueTransactions(accessToken, leagueKey);

    const transactions = transactionsData?.fantasy_content?.league?.[1]?.transactions;
    if (!transactions) return;

    // Yahoo returns an object with keys "0", "1", ... "count"
    // We need to iterate through them
    for (const key in transactions) {
        if (key === "count") continue;
        const transaction = transactions[key].transaction;
        if (!transaction) continue;

        // transaction is an array: [ { transaction_key, ... }, { players: ... } ]
        const meta = transaction[0];
        const playersData = transaction[1]?.players;

        const transactionKey = meta.transaction_key;
        const type = meta.type; // trade, add, drop
        const timestamp = new Date(parseInt(meta.timestamp) * 1000);

        // Check if already processed
        const existingTransaction = await prisma.yahooTransaction.findUnique({
            where: { transactionKey }
        });

        let shouldProcessRoster = false;
        let isNewTrade = false;

        if (type === 'trade') {
            // Check YahooTrade status
            const existingTrade = await prisma.yahooTrade.findUnique({
                where: { yahooTradeId: transactionKey }
            });

            const newStatus = meta.status || 'proposed';
            const oldStatus = existingTrade?.status;

            // If status changed to successful, or if it is successful and we haven't processed it
            if (newStatus === 'successful' && oldStatus !== 'successful') {
                shouldProcessRoster = true;
            }

            // Upsert YahooTrade
            const trade = await prisma.yahooTrade.upsert({
                where: { yahooTradeId: transactionKey },
                create: {
                    yahooTradeId: transactionKey,
                    leagueId,
                    status: newStatus,
                    offeredBy: meta.trader_team_key,
                    offeredTo: meta.tradee_team_key,
                },
                update: {
                    status: newStatus
                }
            });

            if (!existingTrade) isNewTrade = true;

            // Create Items if they don't exist
            if (playersData) {
                for (const pKey in playersData) {
                    if (pKey === "count") continue;
                    const playerObj = playersData[pKey].player;
                    const playerMeta = playerObj[0];

                    const rawTransData = playerObj[1]?.transaction_data;
                    const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

                    const existingItem = await prisma.yahooTradeItem.findFirst({
                        where: { tradeId: trade.id, playerKey: playerMeta.player_key }
                    });

                    if (!existingItem) {
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
            }

        } else {
            // Add/Drop: Process only if new
            if (!existingTransaction) {
                shouldProcessRoster = true;
            }
        }

        if (existingTransaction && !shouldProcessRoster) continue;

        console.log(`[SYNC] Processing transaction: ${type} (${transactionKey}) - Roster Update: ${shouldProcessRoster}`);

        // Process Players (Roster Moves)
        if (shouldProcessRoster && playersData) {
            // playersData is an object with "0", "1", ... "count"
            for (const pKey in playersData) {
                if (pKey === "count") continue;
                const playerObj = playersData[pKey].player;

                // playerObj is array: [ { player_key, ... }, { transaction_data: ... } ]
                const playerMeta = playerObj[0];

                const rawTransData = playerObj[1]?.transaction_data;
                const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

                const playerKey = playerMeta?.player_key;
                if (!playerKey) {
                    console.warn(`[SYNC] Missing player key in transaction data`);
                    continue;
                }

                const sourceTeamKey = transData?.source_team_key;
                const destTeamKey = transData?.destination_team_key;

                // Find Player in DB
                const player = await prisma.player.findUnique({
                    where: { id: playerKey }
                });

                if (!player) {
                    console.warn(`[SYNC] Player not found in DB: ${playerKey}`);
                    continue;
                }

                if (type === "trade" && destTeamKey) {
                    // Find Destination Team
                    const destTeam = await prisma.team.findUnique({
                        where: { yahooTeamKey: destTeamKey }
                    });
                    // Find Source Team
                    const sourceTeam = sourceTeamKey ? await prisma.team.findUnique({
                        where: { yahooTeamKey: sourceTeamKey }
                    }) : null;

                    if (destTeam) {
                        await prisma.player.update({
                            where: { id: player.id },
                            data: {
                                teams: {
                                    connect: { id: destTeam.id },
                                    ...(sourceTeam ? { disconnect: { id: sourceTeam.id } } : {})
                                }
                            }
                        });
                        console.log(`[TRADE] Moved ${player.fullName} to ${destTeam.name}`);
                    }
                } else if (type === "add" && destTeamKey) {
                    const destTeam = await prisma.team.findUnique({
                        where: { yahooTeamKey: destTeamKey }
                    });

                    if (destTeam) {
                        await prisma.player.update({
                            where: { id: player.id },
                            data: {
                                teams: {
                                    connect: { id: destTeam.id }
                                }
                            }
                        });
                        console.log(`[ADD] Added ${player.fullName} to ${destTeam.name}`);
                    }
                } else if (type === "drop" && sourceTeamKey) {
                    const sourceTeam = await prisma.team.findUnique({
                        where: { yahooTeamKey: sourceTeamKey }
                    });

                    if (sourceTeam) {
                        await prisma.player.update({
                            where: { id: player.id },
                            data: {
                                teams: {
                                    disconnect: { id: sourceTeam.id }
                                }
                            }
                        });
                        console.log(`[DROP] Dropped ${player.fullName} from ${sourceTeam.name}`);
                    }
                }
            }
        }

        // Record Transaction
        if (!existingTransaction) {
            await prisma.yahooTransaction.create({
                data: {
                    transactionKey,
                    leagueId,
                    type,
                    timestamp,
                    details: transaction as any
                }
            });
        }

        // Notify League Users
        if (isNewTrade) {
            const leagueUsers = await prisma.user.findMany({
                where: {
                    teams: {
                        some: {
                            leagueId: leagueId
                        }
                    }
                }
            });

            for (const user of leagueUsers) {
                await createNotification(
                    user.id,
                    "TRADE_ALERT",
                    "Official Yahoo Update",
                    "New Trade Detected in League!",
                    `/league/${leagueId}`
                );
            }
        }
    }
}

async function syncPendingTradesForTeam(accessToken: string, leagueKey: string, teamKey: string, leagueId: string) {
    console.log(`[SYNC] Checking pending trades for team ${teamKey}...`);
    const data = await getPendingTradeTransactions(accessToken, leagueKey, teamKey);
    const transactions = data?.fantasy_content?.league?.[1]?.transactions;

    if (!transactions || transactions.count === 0) return;

    for (const key in transactions) {
        if (key === "count") continue;
        const transaction = transactions[key].transaction;
        if (!transaction) continue;

        const meta = transaction[0];
        const playersData = transaction[1]?.players;
        const transactionKey = meta.transaction_key;

        // Upsert YahooTrade
        const trade = await prisma.yahooTrade.upsert({
            where: { yahooTradeId: transactionKey },
            create: {
                yahooTradeId: transactionKey,
                leagueId,
                status: meta.status || 'proposed',
                offeredBy: meta.trader_team_key,
                offeredTo: meta.tradee_team_key,
            },
            update: {
                status: meta.status || 'proposed'
            }
        });

        // Create Items
        if (playersData) {
            for (const pKey in playersData) {
                if (pKey === "count") continue;
                const playerObj = playersData[pKey].player;
                const playerMeta = Array.isArray(playerObj) ? playerObj[0] : playerObj;
                // Handle nested array structure if present
                const pMeta = Array.isArray(playerMeta) ? playerMeta[0] : playerMeta;

                // Transaction data is usually in the second element if playerObj is an array
                const rawTransData = Array.isArray(playerObj) && playerObj[1] ? playerObj[1].transaction_data : null;
                // Yahoo returns transaction_data as an array [ { source_team_key: ... } ]
                const transData = Array.isArray(rawTransData) ? rawTransData[0] : rawTransData;

                if (!pMeta?.player_key || !transData) continue;

                // Validate keys to prevent crash
                if (!transData.source_team_key || !transData.destination_team_key) {
                    console.warn(`[SYNC] Missing team keys for player ${pMeta?.player_key}`, transData);
                    continue;
                }

                const existingItem = await prisma.yahooTradeItem.findFirst({
                    where: { tradeId: trade.id, playerKey: pMeta.player_key }
                });

                if (!existingItem) {
                    await prisma.yahooTradeItem.create({
                        data: {
                            tradeId: trade.id,
                            playerKey: pMeta.player_key,
                            senderTeamKey: transData.source_team_key,
                            receiverTeamKey: transData.destination_team_key
                        }
                    });
                }
            }
        }
    }
}
