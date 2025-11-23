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
