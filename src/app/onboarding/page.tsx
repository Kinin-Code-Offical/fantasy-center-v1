/**
 * This TypeScript React component is for an onboarding page where users are prompted to complete their
 * profile information before accessing the main content.
 * 
 * Returns:
 *   The code snippet is a TypeScript React component for an onboarding page. It first checks if a user
 * is authenticated by retrieving the user session and user ID. If the user is not authenticated, it
 * redirects to the login page.
 */
/* This code snippet is a TypeScript React component for an onboarding page. Here's a breakdown of what
the code is doing: */
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    // Eğer bilgiler zaten tamsa anasayfaya at
    if (user?.username && user?.birthDate) {
        redirect("/");
    }

    return (
        <div className="min-h-screen md:min-h-0 md:h-full md:overflow-y-auto text-slate-200 flex items-center justify-center relative custom-scrollbar">
            <div className="relative z-10 w-full max-w-md p-8 bg-[#0a0a12]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
                        WELCOME <span className="text-neon-cyan">{user?.firstName || "PLAYER"}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        We need to verify your identity before entering the Trade Center Fantasy world.
                    </p>
                </div>

                <OnboardingForm user={user} />
            </div>
        </div>
    );
}
