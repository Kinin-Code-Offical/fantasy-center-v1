import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";
import BackButton from "@/components/BackButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="w-full h-auto md:h-full md:overflow-y-auto bg-[#050505] text-slate-200 pt-24 px-4 pb-20 relative font-sans custom-scrollbar">

            <div className="max-w-2xl mx-auto relative z-10 min-h-full">
                {/* Back Link */}
                <div className="mb-8 flex justify-between items-center">
                    <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors text-sm tracking-widest uppercase font-mono">
                        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-green-500/50 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span>Return to Base</span>
                    </Link>
                </div>

                {/* Main Container */}
                <div className="bg-black/80 backdrop-blur-md border border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    {/* Header */}
                    <div className="p-6 border-b border-green-500/30 bg-green-900/10">
                        <h1 className="text-xl font-bold text-green-400 tracking-widest uppercase flex items-center gap-3">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            System Configuration // User Profile
                        </h1>
                        <p className="text-[10px] font-mono text-green-500/50 mt-1">
                            ID: {user.id.substring(0, 8)}...{user.id.substring(user.id.length - 4)}
                        </p>
                    </div>

                    {/* Form Content */}
                    <div className="p-8">
                        <SettingsForm user={user} />
                    </div>
                </div>
            </div>
        </div>
    );
}
