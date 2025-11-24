import { prisma } from "@/lib/prisma";

interface YahooTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    xoauth_yahoo_guid?: string;
}

export async function getValidYahooToken(userId: string): Promise<string> {
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: "yahoo",
        },
    });

    if (!account || !account.access_token || !account.refresh_token || !account.expires_at) {
        throw new Error("Yahoo account not found or incomplete for user");
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = now >= account.expires_at - 300;

    if (!isExpired) {
        return account.access_token;
    }

    // Token is expired, refresh it
    console.log("Refreshing Yahoo access token...");

    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing Yahoo Client ID or Secret in environment variables");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    try {
        const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                redirect_uri: process.env.NEXTAUTH_URL + "/api/auth/callback/yahoo", // Ensure this matches your callback URL
                refresh_token: account.refresh_token,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to refresh Yahoo token:", errorText);
            throw new Error(`Failed to refresh token: ${response.statusText}`);
        }

        const data: YahooTokenResponse = await response.json();

        // Update account in database
        const newExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

        await prisma.account.update({
            where: {
                id: account.id,
            },
            data: {
                access_token: data.access_token,
                refresh_token: data.refresh_token, // Yahoo might rotate the refresh token
                expires_at: newExpiresAt,
            },
        });

        return data.access_token;
    } catch (error) {
        console.error("Error refreshing Yahoo token:", error);
        throw error;
    }
}
