import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateListingModal from "@/components/CreateListingModal";
import TradeCard from "@/components/TradeCard";
import MarketFilter from "@/components/MarketFilter";
import DatabaseAssetCard from "@/components/DatabaseAssetCard";

interface MarketPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MarketPage({ searchParams }: MarketPageProps) {
    const session = await getServerSession(authOptions);
    const params = await searchParams;

    const query = typeof params.q === 'string' ? params.q : undefined;
    const position = typeof params.pos === 'string' && params.pos !== 'ALL' ? params.pos : undefined;
    const filter = typeof params.filter === 'string' ? params.filter : undefined;
    const leagueId = typeof params.leagueId === 'string' ? params.leagueId : undefined;

    let displayItems: any[] = [];
    let isGlobalSearch = false;

    // User Data
    let userPlayers: any[] = [];
    let currentUserId = "";
    let userActiveListingPlayerIds: string[] = [];
    let userLeagueIds: string[] = [];
    let userLeagues: { id: string; name: string }[] = [];

    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                teams: {
                    include: {
                        players: true,
                        league: true
                    }
                }
            }
        });

        if (user) {
            currentUserId = user.id;
            userLeagueIds = user.teams.map(t => t.leagueId);
            userLeagues = user.teams.map(t => ({ id: t.league.id, name: t.league.name }));
            // Flatten players from all teams the user manages
            userPlayers = user.teams.flatMap(team => team.players) || [];

            // Fetch user's active listings to prevent duplicates
            const userListings = await prisma.tradeListing.findMany({
                where: {
                    sellerId: currentUserId,
                    status: "ACTIVE"
                },
                select: { playerId: true }
            });
            userActiveListingPlayerIds = userListings.map(l => l.playerId);
        }
    }

    if (query) {
        isGlobalSearch = true;
        // Search Players (Global Database Search)
        const players = await prisma.player.findMany({
            where: {
                fullName: { contains: query, mode: 'insensitive' },
                ...(position ? { primaryPos: position } : {})
            },
            include: {
                listings: {
                    where: { status: "ACTIVE" },
                    include: {
                        seller: true,
                        player: true,
                        offers: true
                    }
                }
            }
        });
        displayItems = players;
    } else {
        // Default: Fetch Active Listings
        const whereClause: any = { status: "ACTIVE" };

        if (position) {
            whereClause.player = { primaryPos: position };
        }

        if (leagueId) {
            whereClause.player = {
                ...(whereClause.player || {}),
                teams: {
                    some: {
                        leagueId: leagueId
                    }
                }
            };
        } else if (filter === 'mine' && currentUserId) {
            whereClause.sellerId = currentUserId;
        } else if (filter === 'myleague' && userLeagueIds.length > 0) {
            whereClause.player = {
                ...(whereClause.player || {}),
                teams: {
                    some: {
                        leagueId: { in: userLeagueIds }
                    }
                }
            };
        }

        const listings = await prisma.tradeListing.findMany({
            where: whereClause,
            include: {
                seller: true,
                player: true,
                offers: true
            },
            orderBy: { createdAt: "desc" }
        });
        displayItems = listings;
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 px-4 md:px-8 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Top Navigation */}
                <div className="mb-8 flex justify-between items-center">
                    <Link href="/" className="group relative px-5 py-2 overflow-hidden bg-black/40 border border-white/10 hover:border-green-500/50 transition-all duration-300"
                        style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                    >
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-green-500/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />

                        {/* Content */}
                        <div className="relative flex items-center gap-3">
                            <ArrowLeft className="w-4 h-4 text-green-500/70 group-hover:text-green-400 transition-colors" />
                            <span className="text-xs font-black text-gray-300 group-hover:text-white uppercase tracking-[0.2em]">
                                RETURN TO BASE
                            </span>
                        </div>

                        {/* Tech Deco */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/30 group-hover:border-green-400 transition-colors" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/30 group-hover:border-green-400 transition-colors" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-green-500 tracking-widest">MARKET STATUS: OPEN</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 glitch-text" data-text={isGlobalSearch ? "SEARCH RESULTS" : "TRADE BLOCK"}>
                            {isGlobalSearch ? "SEARCH RESULTS" : "TRADE BLOCK"}
                        </h1>
                        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">
                            {isGlobalSearch ? "// GLOBAL DATABASE QUERY // ALL ASSETS" : "// P2P ASSET EXCHANGE // LIVE OFFERS // INSTANT SWAPS"}
                        </p>
                    </div>

                    {/* Create Listing Button */}
                    {session ? (
                        <CreateListingModal userPlayers={userPlayers} activeListingPlayerIds={userActiveListingPlayerIds} />
                    ) : (
                        <Link href="/login" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold uppercase tracking-widest">
                            Login to Trade
                        </Link>
                    )}
                </div>

                {/* Search & Filter */}
                <div className="relative z-50">
                    <MarketFilter userLeagues={userLeagues} />
                </div>

                {/* Listings Grid */}
                {displayItems.length > 0 ? (
                    <div className="relative min-h-[500px] z-0">
                        {/* Scanning Grid Animation Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#22c55e10,transparent)] pointer-events-none" />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                            {displayItems.map((item) => {
                                if (isGlobalSearch) {
                                    // Item is a Player
                                    const activeListing = item.listings && item.listings.length > 0 ? item.listings[0] : null;
                                    if (activeListing) {
                                        return (
                                            <TradeCard
                                                key={activeListing.id}
                                                listing={activeListing}
                                                userPlayers={userPlayers}
                                                currentUserId={currentUserId}
                                            />
                                        );
                                    } else {
                                        return (
                                            <DatabaseAssetCard
                                                key={item.id}
                                                player={item}
                                            />
                                        );
                                    }
                                } else {
                                    // Item is a Listing
                                    return (
                                        <TradeCard
                                            key={item.id}
                                            listing={item}
                                            userPlayers={userPlayers}
                                            currentUserId={currentUserId}
                                        />
                                    );
                                }
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />

                        {/* Pulse Animation */}
                        <div className="absolute w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse" />

                        <div className="relative z-10 text-center">
                            <div className="text-6xl mb-6 animate-bounce opacity-50">📡</div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-2">
                                SYSTEM IDLE
                            </h3>
                            <div className="flex items-center justify-center gap-2 text-green-500 font-mono text-xs uppercase tracking-[0.2em]">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                Awaiting Market Input
                            </div>
                            <p className="text-gray-500 mt-6 font-mono text-xs max-w-md mx-auto">
                                // No active trade signals detected on the network.
                                <br />
                                // Initiate a new listing to populate the exchange.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
