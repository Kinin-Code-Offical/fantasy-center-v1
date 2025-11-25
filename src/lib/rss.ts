import Parser from 'rss-parser';
import { prisma } from '@/lib/prisma';
import { Player } from '@prisma/client';

const parser = new Parser();

const RSS_FEEDS = [
    'https://sports.yahoo.com/nba/rss.xml',
    // Add more if needed, e.g. Rotoworld if available publicly
];

export async function fetchAndProcessNews(priorityPlayers: Player[]) {
    console.log(`[RSS] Starting news fetch for ${priorityPlayers.length} priority players...`);
    let totalProcessed = 0;
    let totalMatched = 0;

    // 1. Preparation: Create Map and Regex for O(1) lookup
    // Map: "luka doncic" -> "nba.p.123"
    const playerMap = new Map<string, string>();
    const validNames: string[] = [];

    priorityPlayers.forEach(p => {
        if (p.fullName && p.fullName.length >= 4) {
            const normalized = p.fullName.toLowerCase();
            playerMap.set(normalized, p.id);
            validNames.push(escapeRegExp(normalized));
        }
    });

    if (validNames.length === 0) {
        console.log('[RSS] No valid player names to search for.');
        return 0;
    }

    // Create a single Regex to scan text: /luka doncic|lebron james|.../gi
    const playerRegex = new RegExp(validNames.join("|"), "gi");

    // Store data first, then batch write
    const newsItemsToUpsert: Array<{
        playerId: string;
        headline: string;
        content: string;
        url: string;
        source: string;
        publishedAt: Date;
    }> = [];

    for (const feedUrl of RSS_FEEDS) {
        try {
            console.log(`[RSS] Fetching feed: ${feedUrl}`);
            const feed = await parser.parseURL(feedUrl);

            console.log(`[RSS] Found ${feed.items.length} items in feed.`);

            for (const item of feed.items) {
                totalProcessed++;
                const title = item.title || '';
                const content = item.content || item.contentSnippet || '';
                const fullText = `${title} ${content}`;

                // 2. Execution: Scan text using Regex
                const matches = fullText.match(playerRegex);

                if (matches) {
                    // Deduplicate matches (e.g. if "Luka Doncic" appears twice)
                    const uniqueNames = new Set(matches.map(m => m.toLowerCase()));

                    for (const name of uniqueNames) {
                        const playerId = playerMap.get(name);
                        if (playerId) {
                            newsItemsToUpsert.push({
                                playerId,
                                headline: title,
                                content: content,
                                url: item.link || '',
                                source: feed.title || 'RSS Feed',
                                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                            });
                            totalMatched++;
                        }
                    }
                }
            }

        } catch (error) {
            console.error(`[RSS] Error fetching feed ${feedUrl}:`, error);
        }
    }

    // 3. Batch Write
    if (newsItemsToUpsert.length > 0) {
        console.log(`[RSS] Executing ${newsItemsToUpsert.length} DB operations in batches...`);

        const BATCH_SIZE = 5;
        for (let i = 0; i < newsItemsToUpsert.length; i += BATCH_SIZE) {
            const batch = newsItemsToUpsert.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(item =>
                prisma.playerNews.upsert({
                    where: {
                        playerId_headline: {
                            playerId: item.playerId,
                            headline: item.headline
                        }
                    },
                    update: {},
                    create: item
                }).catch(err => console.error(`[RSS] Error saving news for ${item.playerId}:`, err))
            ));
        }
    }

    console.log(`[RSS] Finished. Processed ${totalProcessed} items. Matched ${totalMatched} news entries.`);
    return totalMatched;
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}