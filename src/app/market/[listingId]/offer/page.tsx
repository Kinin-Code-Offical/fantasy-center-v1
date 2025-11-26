import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import TradeOfferInterface from "./TradeOfferInterface";

interface PageProps {
    params: Promise<{ listingId: string }>;
}

export default async function OfferPage({ params }: PageProps) {
    const { listingId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const listing = await prisma.tradeListing.findUnique({
        where: { id: listingId },
        include: {
            seller: true,
            player: {
                include: {
                    teams: {
                        include: { league: true }
                    }
                }
            }
        }
    });

    if (!listing) {
        notFound();
    }

    // 1. Lig Bağlamını ve Rakip Takımı Bul
    // İlandaki oyuncunun hangi takımda olduğuna bakarak ligi buluyoruz
    const sellerTeam = listing.player.teams.find((t: any) => t.managerId === listing.sellerId);

    const targetLeagueId = sellerTeam?.leagueId;
    const targetLeagueName = sellerTeam?.league.name;
    const targetYahooLeagueKey = sellerTeam?.league.yahooLeagueKey;
    const sellerTeamKey = sellerTeam?.yahooTeamKey; // <--- EKLENDİ: Rakip Takım Key

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            teams: {
                include: {
                    players: true
                }
            }
        }
    });

    if (!user) {
        redirect("/login");
    }

    // 2. Kullanıcının Bu Ligdeki Takımını Bul
    const userTeamInLeague = user.teams.find(t => t.leagueId === targetLeagueId);
    const userTeamKey = userTeamInLeague?.yahooTeamKey; // <--- EKLENDİ: Senin Takım Key

    // Kullanıcının oyuncularını filtrele
    // Not: Oyunculara teamKey eklemeye gerek yok, yukarıdaki userTeamKey'i kullanacağız
    const validUserPlayers = userTeamInLeague ? userTeamInLeague.players : [];

    // 3. Fetch Active Market Offers (Internal)
    const pendingMarketOffers = await prisma.tradeOffer.findMany({
        where: {
            offererId: user.id,
            status: "PENDING"
        },
        select: {
            offeredPlayerId: true
        }
    });

    // 4. Fetch Active Yahoo Trades (External)
    let pendingYahooTrades: any[] = [];
    if (userTeamKey) {
        pendingYahooTrades = await prisma.yahooTrade.findMany({
            where: {
                offeredBy: userTeamKey,
                status: "proposed"
            },
            include: {
                items: true
            }
        });
    }

    // Combine locked player IDs
    // User requested to allow offering the same player in multiple trades.
    // We only lock players if they are involved in a trade *for this specific listing* (preventing duplicate offers to same listing is handled elsewhere or logic can be minimal here).
    // For now, we remove the global lock.
    const lockedPlayerIds = new Set<string>();

    /*
    pendingMarketOffers.forEach(offer => {
        if (offer.offeredPlayerId) lockedPlayerIds.add(offer.offeredPlayerId);
    });

    pendingYahooTrades.forEach(trade => {
        trade.items.forEach((item: any) => {
            if (item.senderTeamKey === userTeamKey) {
                lockedPlayerIds.add(item.playerKey);
            }
        });
    });
    */

    return (
        <TradeOfferInterface
            listing={listing}
            userPlayers={validUserPlayers}
            currentUserId={user.id}
            leagueName={targetLeagueName}
            leagueId={targetLeagueId}
            yahooLeagueKey={targetYahooLeagueKey}
            // YENİ PROPLAR:
            sourceTeamKey={userTeamKey}
            targetTeamKey={sellerTeamKey}
            lockedPlayerIds={Array.from(lockedPlayerIds)}
        />
    );
}