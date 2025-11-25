
export function getTradeRedirectUrl(
    sportCode: string,
    leagueKey: string,
    sourceTeamKey: string,
    targetTeamKey: string,
    offeredPlayerKeys: string[],
    requestedPlayerKeys: string[]
) {
    console.log("[Trade Debug] Generating URL...");
    console.log("  - Sport Code:", sportCode);
    console.log("  - League:", leagueKey);
    console.log("  - Source Team:", sourceTeamKey);
    console.log("  - Target Team:", targetTeamKey);
    console.log("  - Offered:", offeredPlayerKeys);
    console.log("  - Requested:", requestedPlayerKeys);

    // 1. Parse IDs
    const getIntId = (key: string) => key.split('.').pop();

    const leagueId = getIntId(leagueKey);
    const sourceTeamId = getIntId(sourceTeamKey);
    const targetTeamId = getIntId(targetTeamKey);

    // 2. Determine Subdomain & Path
    let subdomain = "fantasysports";
    let sportPath = "";

    switch (sportCode.toLowerCase()) {
        case "nfl":
            subdomain = "football.fantasysports";
            sportPath = "f1";
            break;
        case "nba":
            subdomain = "basketball.fantasysports";
            sportPath = "nba";
            break;
        case "mlb":
            subdomain = "baseball.fantasysports";
            sportPath = "b1";
            break;
        case "nhl":
            subdomain = "hockey.fantasysports";
            sportPath = "hockey";
            break;
        default:
            subdomain = `${sportCode}.fantasysports`;
            sportPath = sportCode;
            break;
    }

    // 3. Construct Base URL
    // Example: https://basketball.fantasysports.yahoo.com/nba/12345/1/proposetrade?stage=1&mid2=9
    const baseUrl = `https://${subdomain}.yahoo.com/${sportPath}/${leagueId}/${sourceTeamId}/proposetrade`;

    // 4. Build Query String Manually
    let queryString = `?stage=1&mid2=${targetTeamId}`;

    // Loop through offered players (Source/Team1)
    offeredPlayerKeys.forEach(key => {
        queryString += `&tpids2[]=${getIntId(key)}`;
    });

    // Loop through requested players (Target/Team2)
    requestedPlayerKeys.forEach(key => {
        queryString += `&tpids2[]=${getIntId(key)}`;
    });

    const finalUrl = baseUrl + queryString;
    console.log("[Trade Debug] Final Generated URL:", finalUrl);
    return finalUrl;
}