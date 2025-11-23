import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getUserLeagues } from "@/lib/actions";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let leagues: any[] = [];
  let error = null;

  if (session?.user) {
    // --- ONBOARDING KONTROLÜ ---
    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.username || !user?.birthDate) {
      redirect("/onboarding");
    }
    // ---------------------------

    try {
      leagues = await getUserLeagues();
    } catch (e) {
      console.error("Failed to fetch leagues", e);
      // Sessizce başarısız ol, kullanıcıya lig yokmuş gibi göster veya hata mesajı ver
      // error = "Lig verileri alınırken bir hata oluştu.";
    }
  }

  return (
    <main className="min-h-screen bg-[#030014] text-slate-200 overflow-hidden relative selection:bg-neon-cyan selection:text-black">
      {/* BACKGROUND ASSETS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/theme.png')] bg-cover bg-center opacity-20 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030014]/50 via-[#030014]/80 to-[#030014]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
      </div>

      <div className="relative z-20">
        <Navbar />

        {/* HERO BÖLÜMÜ (Giriş Yapılmamışsa veya Lig Yoksa) */}
        {leagues.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 py-12 relative">
            {/* GLOW EFFECT */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>

            <h1 className="text-6xl md:text-9xl font-black mb-2 tracking-tighter text-white drop-shadow-[0_0_30px_rgba(188,19,254,0.6)]">
              TRADE <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-purple animate-gradient-x">FANTASY</span>
            </h1>

            <div className="h-1 w-32 bg-gradient-to-r from-neon-cyan to-neon-purple mb-8 rounded-full shadow-[0_0_10px_rgba(0,243,255,0.8)]"></div>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mb-12 font-light tracking-wide leading-relaxed">
              <span className="text-neon-cyan font-bold drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">YAHOO FANTASY</span> LİGLERİNİZİ YÖNETİN.<br />
              ARKADAŞLARINIZLA <span className="text-neon-purple font-bold">TAKAS YAPIN</span>, BAHİSLERE GİRİN VE <span className="text-neon-pink font-bold">HÜKMET.</span>
            </p>

            {!session && (
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-8 bg-[#0a0a12] rounded-lg border border-white/10 leading-none flex items-center">
                  <span className="text-slate-400 mr-4">BAŞLAMAK İÇİN</span>
                  <Link href="/login" className="text-neon-cyan font-bold hover:text-white transition-colors uppercase tracking-widest border-b border-neon-cyan hover:border-white pb-1">
                    GİRİŞ YAPIN ↗
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          // --- LİGLER LİSTESİ ---
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold mb-8 text-white border-l-4 border-neon-cyan pl-4 uppercase tracking-widest">
              Aktif Ligleriniz
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagues.map((league) => (
                <div key={league.key} className="group relative bg-[#0a0a12] border border-white/10 rounded-xl overflow-hidden hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.15)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-neon-purple transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-white/5 rounded text-xs font-mono text-neon-cyan border border-neon-cyan/20">
                        {league.season}
                      </span>
                      <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                        {league.gameCode}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors truncate">
                      {league.name}
                    </h3>

                    <div className="flex items-center gap-3 mb-6">
                      {league.logoUrl && (
                        <Image
                          src={league.logoUrl}
                          alt={league.name}
                          width={32}
                          height={32}
                          className="rounded-full border border-white/20"
                        />
                      )}
                      <span className="text-sm text-slate-400">
                        {league.numTeams} Takım
                      </span>
                    </div>

                    <Link
                      href={`/league/${league.key}`}
                      className="block w-full py-3 text-center bg-white/5 hover:bg-neon-cyan/10 text-slate-300 hover:text-neon-cyan border border-white/10 hover:border-neon-cyan/50 rounded-lg transition-all font-bold uppercase text-sm tracking-wider"
                    >
                      Lige Git
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}