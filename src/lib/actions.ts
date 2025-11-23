"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { yahooFetch, YahooAPIError } from "@/lib/yahooClient";

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

    // Eğer kullanıcının Yahoo bağlantısı yoksa hata fırlat
    if (!user.yahooId || !user.accessToken) {
        throw new Error("YAHOO_NOT_LINKED");
    }

    let accessToken = user.accessToken;

    if (!accessToken) throw new Error("No access token found");

    try {
        // İlk deneme
        return await yahooFetch(endpoint, accessToken);
    } catch (error) {
        // Eğer token süresi dolmuşsa (401), yenile ve tekrar dene
        if (error instanceof YahooAPIError && error.code === "TOKEN_EXPIRED") {
            console.log("Token expired, refreshing...");

            if (!user.refreshToken) throw new Error("No refresh token available");

            const newTokens = await refreshYahooToken(user.refreshToken);

            // Yeni tokenları DB'ye kaydet
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    accessToken: newTokens.access_token,
                    refreshToken: newTokens.refresh_token, // Yahoo bazen yeni refresh token da döner
                    tokenExpires: BigInt(Math.floor(Date.now() / 1000) + newTokens.expires_in),
                },
            });

            // İkinci deneme (Yeni token ile)
            return await yahooFetch(endpoint, newTokens.access_token);
        }

        throw error;
    }
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
                                where: { id: leagueId },
                                update: {
                                    name,
                                    numTeams,
                                    scoringType,
                                    lastSync: new Date()
                                },
                                create: {
                                    id: leagueId,
                                    gameId,
                                    name,
                                    numTeams,
                                    scoringType,
                                    lastSync: new Date()
                                }
                            });

                            // Takım bilgilerini bul
                            // Yahoo yapısında l.league'den sonra l.teams gelebilir mi?
                            // Genelde yapıda l bir array gibidir: [ {league:..}, {teams:..} ] değil, obje keyleri ile erişilir.
                            // Ancak bizim endpointimiz /leagues/teams olduğu için l objesinin içinde "teams" keyi olabilir mi?
                            // Yahoo JSON yapısı: leagues -> 0 -> league:[], teams:{}

                            // l objesi şuna benzer: { league: [...], teams: {...} }
                            // Ancak bazen array indexleri ile gelir.

                            // Güvenli erişim için kontrol edelim.
                            // l.league var, peki l.teams var mı?
                            // Genelde l bir obje ise ve içinde league varsa, teams de olabilir.

                            let teamId = null;
                            let teamName = null;

                            // l objesinin propertylerini gezerek teams'i bulmaya çalışalım (Yahoo'nun sağı solu belli olmaz)
                            // Genelde l.teams şeklindedir.

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
                                        // 3. TAKIMI SENKRONİZE ET (SYNC TEAM)
                                        await prisma.team.upsert({
                                            where: { id: teamId },
                                            update: {
                                                name: teamName,
                                                logoUrl: teamLogo,
                                                managerId: user.id // Kullanıcıyı bağla
                                            },
                                            create: {
                                                id: teamId,
                                                leagueId: leagueId,
                                                managerId: user.id,
                                                name: teamName,
                                                logoUrl: teamLogo
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
