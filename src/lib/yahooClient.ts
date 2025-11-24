import { XMLParser } from "fast-xml-parser";

const BASE_URL = "https://fantasysports.yahooapis.com/fantasy/v2";

export class YahooAPIError extends Error {
    constructor(public message: string, public status: number, public code?: string) {
        super(message);
        this.name = "YahooAPIError";
    }
}

export async function yahooFetch(endpoint: string, accessToken: string, options: RequestInit = {}) {
    // 1. JSON Formatını Zorla
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${endpoint}${separator}format=json`;

    // 2. İsteği Yap
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    // 3. Hata Yönetimi (Token Expired Yakalama)
    if (!response.ok) {
        // 401 Hatalarını özel olarak işaretle ki Orchestrator yakalayıp token yenilesin
        if (response.status === 401) {
            throw new YahooAPIError("Token expired or invalid", 401, "TOKEN_EXPIRED");
        }

        const errorText = await response.text();
        throw new YahooAPIError(`Yahoo API Error: ${response.statusText} - ${errorText}`, response.status);
    }

    // 4. Yanıtı Dön
    const data = await response.json();
    return data;
}

// --- Helper Functions ---

export async function getUserGames(accessToken: string) {
    // users;use_login=1/games
    const data = await yahooFetch("/users;use_login=1/games", accessToken);
    return data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
}

export async function getUserLeagues(accessToken: string, gameKey: string) {
    // users;use_login=1/games;game_keys={gameKey}/leagues
    const data = await yahooFetch(`/users;use_login=1/games;game_keys=${gameKey}/leagues`, accessToken);
    // Yahoo response structure parsing needed here if we want to return clean list
    return data;
}

export async function getLeagueStandings(accessToken: string, leagueKey: string) {
    // league/{leagueKey}/standings
    const data = await yahooFetch(`/league/${leagueKey}/standings`, accessToken);
    return data;
}

export async function getTeamRoster(accessToken: string, teamKey: string, type: string = "week") {
    // team/{teamKey}/roster;week=current/players/stats
    // We must explicitly request /players/stats to get the points data
    let url = `/team/${teamKey}/roster;week=current/players/stats`;
    if (type === "season") {
        url += ";type=season";
    }
    const data = await yahooFetch(url, accessToken);
    return data;
}

export async function getFullUserStats(accessToken: string) {
    // Efficient fetch for sync: Games -> Leagues -> Teams
    return await yahooFetch("/users;use_login=1/games;is_available=1/leagues/teams", accessToken);
}

export async function getPlayerNews(accessToken: string, playerKeys: string[]) {
    console.log('[NEWS SYNC] Fetching news for:', playerKeys.length);

    // Use smaller chunks for individual requests to avoid rate limiting
    const CONCURRENT_LIMIT = 5;
    const chunks = [];
    for (let i = 0; i < playerKeys.length; i += CONCURRENT_LIMIT) {
        chunks.push(playerKeys.slice(i, i + CONCURRENT_LIMIT));
    }

    let allPlayers: any[] = [];

    for (const chunk of chunks) {
        const promises = chunk.map(async (key) => {
            const url = `/player/${key}/news`;
            try {
                const data = await yahooFetch(url, accessToken);
                // data.fantasy_content should contain the 'player' object
                return data?.fantasy_content;
            } catch (e) {
                console.warn(`[Yahoo News] API unavailable for player ${key}. Skipping.`);
                return null;
            }
        });

        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result) {
                allPlayers.push(result);
            }
        });
    }

    return allPlayers;
}

export async function getLeagueTransactions(accessToken: string, leagueKey: string) {
    // league/{leagueKey}/transactions;types=trade,add,drop
    const data = await yahooFetch(`/league/${leagueKey}/transactions;types=trade,add,drop`, accessToken);
    return data;
}

export async function postTradeToYahoo(accessToken: string, leagueKey: string, tradeData: {
    trader_team_key: string;
    tradee_team_key: string;
    note?: string;
    players: Array<{
        player_key: string;
        source_team_key: string;
        destination_team_key: string;
    }>;
}) {
    const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/transactions`;
    
    // Construct XML
    const xmlBody = `
    <fantasy_content>
      <transaction>
        <type>trade</type>
        <trader_team_key>${tradeData.trader_team_key}</trader_team_key>
        <tradee_team_key>${tradeData.tradee_team_key}</tradee_team_key>
        <note>${tradeData.note || ''}</note>
        <players>
          ${tradeData.players.map((p) => `
          <player>
            <player_key>${p.player_key}</player_key>
            <transaction_data>
              <type>trade</type>
              <source_team_key>${p.source_team_key}</source_team_key>
              <destination_team_key>${p.destination_team_key}</destination_team_key>
            </transaction_data>
          </player>
          `).join('')}
        </players>
      </transaction>
    </fantasy_content>
    `.trim();

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/xml'
        },
        body: xmlBody
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Yahoo Trade Error: ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    return responseText;
}
