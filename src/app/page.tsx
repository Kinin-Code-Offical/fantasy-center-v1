import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getUserLeagues } from "@/lib/actions";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import YahooButton from "@/components/YahooButton";
import StatPanel from "@/components/StatPanel";
import PlayerPanel from "@/components/PlayerPanel";
import LoginCard from "@/components/LoginCard";
import ConnectYahooButton from "@/components/ConnectYahooButton";
import NewsFeed from "@/components/NewsFeed";
import LeagueCard from "@/components/LeagueCard";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let leagues: any[] = [];
  let error = null;
  let isYahooConnected = false;
  let userTeams: any[] = [];

  let topPlayers: any[] = [];

  try {
    // Fetch public data for the landing page (Top Players)
    topPlayers = await prisma.player.findMany({
      take: 5,
      orderBy: { projectedPoints: 'desc' },
      select: {
        id: true,
        fullName: true,
        projectedPoints: true,
        photoUrl: true,
        editorialTeam: true,
        primaryPos: true,
        stats: true
      }
    });
  } catch (e) {
    console.warn("Database connection failed, using fallback data for landing page.");
    // Fallback data to prevent crash if DB is down
    topPlayers = [
      { id: '1', fullName: 'J. Jefferson', projectedPoints: 24.5, photoUrl: null, editorialTeam: 'MIN', primaryPos: 'WR', stats: { ppg: 24.5 } },
      { id: '2', fullName: 'C. McCaffrey', projectedPoints: 22.1, photoUrl: null, editorialTeam: 'SF', primaryPos: 'RB', stats: { ppg: 22.1 } },
      { id: '3', fullName: 'T. Hill', projectedPoints: 19.8, photoUrl: null, editorialTeam: 'MIA', primaryPos: 'WR', stats: { ppg: 19.8 } },
      { id: '4', fullName: 'C. Lamb', projectedPoints: 18.5, photoUrl: null, editorialTeam: 'DAL', primaryPos: 'WR', stats: { ppg: 18.5 } },
    ];
  }

  if (session?.user) {
    // --- ONBOARDING CHECK ---
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        teams: {
          include: {
            league: {
              include: {
                game: true
              }
            }
          }
        }
      }
    });

    if (!user?.username || !user?.birthDate) {
      redirect("/onboarding");
    }

    isYahooConnected = user.accounts.some(acc => acc.provider === "yahoo");
    userTeams = user.teams;

    if (isYahooConnected) {
      try {
        leagues = await getUserLeagues();
      } catch (e) {
        console.error("Failed to fetch leagues", e);
      }
    }
    // ---------------------------
  }

  return (
    <main className="w-full h-full overflow-y-auto text-slate-200 relative selection:bg-neon-cyan selection:text-black custom-scrollbar">
      <div className="relative z-20">
        <Navbar />

        {/* HERO SECTION (If not logged in) */}
        {!session ? (
          <div className="relative w-full max-w-[90rem] mx-auto min-h-[85vh] flex items-center justify-center overflow-hidden gap-8">

            {/* LEFT HUD (Stats Feed) */}
            <div className="hidden xl:block transition-opacity duration-500">
              <StatPanel player={topPlayers[0]} />
            </div>

            {/* CENTER PANEL */}
            <div className="relative z-10 flex justify-center items-center">
              <LoginCard />
            </div>

            {/* RIGHT HUD (Top Plans) */}
            <div className="hidden xl:block transition-opacity duration-500">
              <PlayerPanel players={topPlayers.slice(0, 4)} />
            </div>

          </div>
        ) : (
          // --- LOGGED IN HOME BASE ---
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* LEFT: LEAGUE ACCESS TERMINAL */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6 text-white border-l-4 border-neon-cyan pl-4 uppercase tracking-widest flex items-center gap-3">
                  League Access Terminal
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_10px_#00f3ff]" />
                </h2>

                {!isYahooConnected ? (
                  <div className="text-center max-w-md mx-auto bg-[#0a0a12]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(188,19,254,0.15)] mt-10">
                    <h1 className="text-2xl font-bold text-white mb-4">Connect Yahoo Fantasy</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                      To access your leagues, live stats, and trade analysis, you need to link your Yahoo Fantasy account.
                    </p>
                    <ConnectYahooButton />
                  </div>
                ) : userTeams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userTeams.map((team) => (
                      <LeagueCard
                        key={team.id}
                        leagueId={team.league.id}
                        leagueName={team.league.name}
                        teamName={team.name}
                        logoUrl={team.logoUrl}
                        gameCode={team.league.game.code}
                        season={team.league.game.season}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-slate-400 font-mono mb-4">NO ACTIVE LEAGUES DETECTED</p>
                    <Link href="/dashboard" className="text-neon-cyan hover:underline text-sm uppercase tracking-wider">
                      Go to Dashboard to Sync
                    </Link>
                  </div>
                )}
              </div>

              {/* RIGHT: INTELLIGENCE FEED */}
              <div className="lg:col-span-1">
                <NewsFeed />
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}

