import { getTradeDashboardData } from "@/lib/actions/trade-dashboard";
import TradeConsole from "./TradeConsole";
import { redirect } from "next/navigation";
import CyberBackground from "@/components/CyberBackground";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export default async function TradesPage() {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { emailVerified: true }
        });

        if (user && !user.emailVerified) {
            redirect("/settings");
        }
    }

    const data = await getTradeDashboardData();

    if (!data) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
             <div className="fixed inset-0 z-0 pointer-events-none">
                <CyberBackground />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] opacity-[0.02] pointer-events-none" />
            </div>
            <div className="relative z-10">
                <TradeConsole 
                    incomingListings={data.incoming} 
                    outgoingOffers={data.outgoing} 
                />
            </div>
        </div>
    );
}