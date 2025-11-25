"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { yahooFetch, YahooAPIError, getLeagueTransactions } from "@/lib/yahooClient";
import { getValidYahooToken } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

// --- TOKEN YÖNETİMİ ---

async function refreshYahooToken(refreshToken: string) {
    const clientId = process.env.YAHOO_CLIENT_ID!;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET!;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to refresh token");
    }

    return response.json();
}

async function getAuthenticatedUser() {
    const session = await getServerSession(authOptions);

    // Session'da ID var mı kontrol et (NextAuth callback'inde eklemiştik)
    const userId = (session?.user as any)?.id;

    if (!userId) {
        throw new Error("Unauthorized: No User ID in session");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
}

// --- ORCHESTRATOR (API ÇAĞRILARI) ---

/**
 * Yahoo'dan veri çekerken Token Refresh mekanizmasını yöneten sarmalayıcı.
 */
async function fetchWithRefresh<T>(endpoint: string): Promise<T> {
    const user = await getAuthenticatedUser();

    // Yahoo hesabını bul (Account tablosundan)
    const account = await prisma.account.findFirst({
        where: {
            userId: user.id,
            provider: "yahoo"
        }
    });

    // Eğer kullanıcının Yahoo bağlantısı yoksa hata fırlat
    if (!account || !account.access_token) {
        throw new Error("YAHOO_NOT_LINKED");
    }

    let accessToken = account.access_token;

    try {
        // İlk deneme
        return await yahooFetch(endpoint, accessToken);
    } catch (error) {
        // Eğer token süresi dolmuşsa (401), yenile ve tekrar dene
        if (error instanceof YahooAPIError && error.code === "TOKEN_EXPIRED") {
            console.log("Token expired, refreshing...");

            if (!account.refresh_token) throw new Error("No refresh token available");

            const newTokens = await refreshYahooToken(account.refresh_token);

            // Yeni tokenları Account tablosına kaydet
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    access_token: newTokens.access_token,
                    refresh_token: newTokens.refresh_token, // Yahoo bazen yeni refresh token da döner
                    expires_at: Math.floor(Date.now() / 1000) + newTokens.expires_in,
                },
            });

            // İkinci deneme (Yeni token ile)
            return await yahooFetch(endpoint, newTokens.access_token);
        }

        throw error;
    }
}

// --- YARDIMCI FONKSİYONLAR (SYNC) ---

async function syncRoster(teamKey: string, gameId: string, accessToken: string) {
    try {
        // Yahoo'dan takım kadrosunu çek
        // team/{team_key}/roster
        const data = await yahooFetch(`/team/${teamKey}/roster`, accessToken);

        // @ts-ignore
        const teamWrapper = data?.fantasy_content?.team?.[0];
        // @ts-ignore
        const rosterWrapper = data?.fantasy_content?.team?.[1]?.roster;

        if (!rosterWrapper || !rosterWrapper["0"]?.players) return null;

        const playersObj = rosterWrapper["0"].players;
        const rosterList: any[] = [];

        // Oyuncuları döngüye al
        for (const key in playersObj) {
            const p = playersObj[key].player;
            if (!p) continue;

            // p bir array: [ {player_key...}, {name...}, ... ]
            // Yahoo yapısı biraz karmaşık, sırayla propertyleri bulmamız lazım.

            let playerId = "";
            let fullName = "";
            let status = "Healthy"; // Varsayılan
            let editorialTeam = "";
            let photoUrl = "";
            let primaryPos = "";
            let eligiblePos: string[] = [];

            // Array içindeki objeleri gez
            p.forEach((item: any) => {
                if (item.player_key) playerId = item.player_key;
                if (item.name) fullName = item.name.full;
                if (item.status) status = item.status;
                if (item.editorial_team_abbr) editorialTeam = item.editorial_team_abbr;
                if (item.headshot) photoUrl = item.headshot.url;
                if (item.primary_position) primaryPos = item.primary_position;
                if (item.eligible_positions) {
                    item.eligible_positions.forEach((posObj: any) => {
                        if (posObj.position) eligiblePos.push(posObj.position);
                    });
                }
            });

            if (playerId) {
                // 1. OYUNCUYU DB'YE KAYDET (UPSERT)
                await prisma.player.upsert({
                    where: { id: playerId },
                    update: {
                        fullName,
                        status,
                        editorialTeam,
                        photoUrl,
                        primaryPos,
                        eligiblePos,
                        updatedAt: new Date()
                    },
                    create: {
                        id: playerId,
                        gameId, // "nba" veya oyun ID'si
                        fullName,
                        status,
                        editorialTeam,
                        photoUrl,
                        primaryPos,
                        eligiblePos
                    }
                });

                // Roster listesine ekle (Team modelinde saklanacak JSON için)
                rosterList.push({
                    playerId,
                    fullName,
                    position: primaryPos,
                    status
                });
            }
        }

        return rosterList;

    } catch (error) {
        console.error(`Failed to sync roster for team ${teamKey}:`, error);
        return null;
    }
}

export async function syncTeamRoster(teamKey: string) {
    const user = await getAuthenticatedUser();
    const accessToken = await getValidYahooToken(user.id);

    console.log(`Syncing roster for team: ${teamKey}`);

    // Fetch roster from Yahoo
    // URL: team/<team_key>/roster;players
    const data = await yahooFetch(`/team/${teamKey}/roster;players`, accessToken);

    // Parse Yahoo Response
    // The structure is usually: fantasy_content -> team -> [0] -> roster -> [0] -> players
    const teamData = data.fantasy_content?.team;
    if (!teamData) {
        throw new Error("Invalid Yahoo response: No team data");
    }

    // Yahoo returns arrays mixed with objects. We need to find the roster part.
    // Usually team[1] contains the roster if team[0] is metadata.
    const rosterWrapper = teamData[1]?.roster;
    const playersWrapper = rosterWrapper?.["0"]?.players;

    if (!playersWrapper) {
        console.log("No players found in roster.");
        return;
    }

    // playersWrapper is an object with keys "0", "1", ... "count"
    const playerCount = playersWrapper.count;

    for (let i = 0; i < playerCount; i++) {
        const playerObj = playersWrapper[i.toString()].player;
        // playerObj is an array: [0] -> metadata
        const playerMeta = playerObj[0];

        // Extract fields using find because Yahoo returns an array of objects for properties
        const getField = (arr: any[], key: string) => arr.find((x: any) => x.hasOwnProperty(key))?.[key];

        const playerKey = getField(playerMeta, "player_key");
        const name = getField(playerMeta, "name");
        const editorialTeam = getField(playerMeta, "editorial_team_abbr");
        const headshot = getField(playerMeta, "headshot");
        const primaryPos = getField(playerMeta, "primary_position");

        if (!playerKey) continue;

        // Upsert Player
        const player = await prisma.player.upsert({
            where: { id: playerKey },
            create: {
                id: playerKey,
                gameId: playerKey.split('.')[0], // "nba.p.123" -> "nba"
                fullName: name?.full || "Unknown",
                editorialTeam: editorialTeam,
                photoUrl: headshot?.url,
                primaryPos: primaryPos,
            },
            update: {
                fullName: name?.full || "Unknown",
                editorialTeam: editorialTeam,
                photoUrl: headshot?.url,
                primaryPos: primaryPos,
            }
        });

        // Connect to Team
        // We use connect to add the player to the team's roster
        await prisma.team.update({
            where: { yahooTeamKey: teamKey },
            data: {
                players: {
                    connect: { id: player.id }
                }
            }
        });
    }

    console.log(`Synced ${playerCount} players for team ${teamKey}`);
}

// --- SERVER ACTIONS (UI İÇİN) ---

export async function getUserLeagues() {
    const user = await getAuthenticatedUser();

    try {
        // Yahoo'dan ligleri ve takımları çek
        // users;use_login=1/games;game_keys=nba/leagues/teams
        const data = await fetchWithRefresh<any>("/users;use_login=1/games;game_keys=nba/leagues/teams");

        const games = data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
        if (!games) return [];

        const leagues: any[] = [];

        // Oyunları döngüye al
        for (const gameKey in games) {
            const game = games[gameKey];
            if (game?.game) {
                const gameMeta = game.game[0];
                const gameId = gameMeta.game_key;
                const gameCode = gameMeta.code;
                const season = parseInt(gameMeta.season);

                // 1. OYUNU SENKRONİZE ET (SYNC GAME)
                await prisma.game.upsert({
                    where: { id: gameId },
                    update: { season },
                    create: { id: gameId, code: gameCode, season }
                });

                if (game.game[1]?.leagues) {
                    const leagueData = game.game[1].leagues;

                    for (const leagueKey in leagueData) {
                        const l = leagueData[leagueKey];
                        if (l?.league) {
                            const meta = l.league[0];

                            // Lig bilgilerini al
                            const leagueId = meta.league_key;
                            const name = meta.name;
                            const numTeams = meta.num_teams;
                            const scoringType = meta.scoring_type;
                            const url = meta.url;
                            const logoUrl = meta.logo_url || null;

                            // 2. LİGİ SENKRONİZE ET (SYNC LEAGUE)
                            await prisma.league.upsert({
                                where: { yahooLeagueKey: leagueId },
                                update: {
                                    name,
                                    numTeams,
                                    scoringType,
                                    lastSync: new Date()
                                },
                                create: {
                                    yahooLeagueKey: leagueId,
                                    gameId,
                                    name,
                                    numTeams,
                                    scoringType,
                                    lastSync: new Date()
                                }
                            });

                            // Takım bilgilerini bul
                            let teamId = null;
                            let teamName = null;

                            // @ts-ignore
                            const teamsObj = l.teams;

                            if (teamsObj) {
                                // teams: { "0": { "team": [[...]] } }
                                const firstTeamKey = Object.keys(teamsObj)[0];
                                if (firstTeamKey && teamsObj[firstTeamKey]?.team) {
                                    const teamData = teamsObj[firstTeamKey].team[0];
                                    // teamData: [ { team_key:..., name:... }, { team_logos:... } ]

                                    teamId = teamData[0]?.team_key;
                                    teamName = teamData[0]?.name;
                                    const teamLogo = teamData[0]?.team_logos?.[0]?.team_logo?.url || null;

                                    if (teamId) {
                                        // 4. ROSTER SENKRONİZASYONU (YENİ)
                                        // Token'ı tekrar almamız gerekebilir ama fetchWithRefresh içinde zaten alınıyor.
                                        // Ancak syncRoster fonksiyonuna token geçmemiz lazım.
                                        // Performans için burada tekrar DB'ye gitmek yerine, fetchWithRefresh'in döndürdüğü token'ı kullanabilirdik
                                        // ama fetchWithRefresh soyutlanmış.
                                        // Şimdilik basitçe Account'tan token'ı alalım.

                                        const account = await prisma.account.findFirst({
                                            where: { userId: user.id, provider: "yahoo" }
                                        });

                                        let rosterData = null;
                                        if (account?.access_token) {
                                            rosterData = await syncRoster(teamId, gameId, account.access_token);
                                        }

                                        // 3. TAKIMI SENKRONİZE ET (SYNC TEAM)
                                        await prisma.team.upsert({
                                            where: { yahooTeamKey: teamId },
                                            update: {
                                                name: teamName,
                                                logoUrl: teamLogo,
                                                managerId: user.id, // Kullanıcıyı bağla
                                                roster: rosterData || undefined // Eğer roster çekildiyse güncelle
                                            },
                                            create: {
                                                yahooTeamKey: teamId,
                                                league: { connect: { yahooLeagueKey: leagueId } },
                                                manager: { connect: { id: user.id } },
                                                name: teamName,
                                                logoUrl: teamLogo,
                                                roster: rosterData || undefined
                                            }
                                        });
                                    }
                                }
                            }

                            leagues.push({
                                key: leagueId,
                                id: leagueId,
                                name: name,
                                url: url,
                                logoUrl: logoUrl,
                                season: parseInt(meta.season),
                                numTeams: numTeams,
                                scoringType: scoringType,
                                gameCode: gameCode,
                            });
                        }
                    }
                }
            }
        }

        return leagues;

    } catch (error: any) {
        // Eğer kullanıcı Yahoo'ya bağlı değilse bu beklenen bir durumdur (Sadece DB'den veri çekecek)
        if (error.message === "YAHOO_NOT_LINKED") {
            console.log("User is not linked to Yahoo. Switching to offline mode (DB only).");
        } else {
            console.error("Yahoo fetch failed, trying DB fallback...", error);
        }

        // Eğer Yahoo bağlantısı yoksa veya hata aldıysak DB'den çekmeyi dene
        // Sadece bu kullanıcıya ait takımların olduğu ligleri getir
        const dbLeagues = await prisma.league.findMany({
            where: {
                teams: {
                    some: {
                        managerId: user.id
                    }
                }
            },
            include: {
                game: true
            }
        });

        if (dbLeagues.length > 0) {
            return dbLeagues.map(l => ({
                key: l.id,
                id: l.id,
                name: l.name,
                url: `https://basketball.fantasysports.yahoo.com/nba/${l.id.split('.').pop()}`, // Tahmini URL
                logoUrl: null, // DB'de logoUrl yoksa null
                season: l.game.season,
                numTeams: l.numTeams,
                scoringType: l.scoringType,
                gameCode: l.game.code,
            }));
        }

        // Eğer DB'de de yoksa ve hata YAHOO_NOT_LINKED ise boş dön
        if (error.message === "YAHOO_NOT_LINKED") {
            return [];
        }

        throw error;
    }
}

export async function syncUserLeagues() {
    const user = await getAuthenticatedUser();
    const accessToken = await getValidYahooToken(user.id);

    console.log("Starting full sync...");

    // Fetch Games -> Leagues -> Teams
    // users;use_login=1/games;is_available=1/leagues/teams
    const data = await yahooFetch("/users;use_login=1/games;is_available=1/leagues/teams", accessToken);

    const games = data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
    if (!games) {
        console.log("No games found.");
        return;
    }

    // Iterate Games
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
            await prisma.league.upsert({
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

            // Iterate Teams
            for (const teamKey in teams) {
                if (teamKey === "count") continue;
                const teamObj = teams[teamKey];
                const teamMeta = teamObj.team[0];

                // Upsert Team
                await prisma.team.upsert({
                    where: { yahooTeamKey: teamMeta.team_key },
                    create: {
                        yahooTeamKey: teamMeta.team_key,
                        league: { connect: { yahooLeagueKey: leagueMeta.league_key } },
                        manager: { connect: { id: user.id } },
                        name: teamMeta.name,
                        logoUrl: teamMeta.team_logos?.[0]?.url,
                        wins: parseInt(teamMeta.team_standings?.outcome_totals?.wins || "0"),
                        losses: parseInt(teamMeta.team_standings?.outcome_totals?.losses || "0"),
                        ties: parseInt(teamMeta.team_standings?.outcome_totals?.ties || "0"),
                        rank: parseInt(teamMeta.team_standings?.rank || "0"),
                    },
                    update: {
                        name: teamMeta.name,
                        logoUrl: teamMeta.team_logos?.[0]?.url,
                        wins: parseInt(teamMeta.team_standings?.outcome_totals?.wins || "0"),
                        losses: parseInt(teamMeta.team_standings?.outcome_totals?.losses || "0"),
                        ties: parseInt(teamMeta.team_standings?.outcome_totals?.ties || "0"),
                        rank: parseInt(teamMeta.team_standings?.rank || "0"),
                    }
                });

                // Trigger Roster Sync for this team
                await syncTeamRoster(teamMeta.team_key);
            }
        }
    }

    console.log("Full sync complete.");
}

export async function checkSystemStatus() {
    const start = Date.now();
    try {
        // Simple DB query to check connectivity
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - start;
        return { status: "ONLINE", latency: dbLatency, timestamp: Date.now() };
    } catch (error) {
        console.error("System status check failed:", error);
        return { status: "OFFLINE", latency: 0, timestamp: Date.now() };
    }
}


