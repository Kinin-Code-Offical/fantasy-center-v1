"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { hash, compare } from "bcryptjs";

export async function getUserProfile() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            teams: {
                include: {
                    league: {
                        include: {
                            game: true
                        }
                    }
                }
            },
            ledgers: {
                orderBy: { createdAt: 'desc' },
                take: 10
            },
            tradesInitiated: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    targetUser: true
                }
            },
            tradesReceived: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    initiator: true
                }
            }
        }
    });

    if (!user) throw new Error("User not found");

    // Fetch recent matchups for user's teams
    const teamIds = user.teams.map(t => t.id);
    const recentMatchups = await prisma.matchup.findMany({
        where: {
            OR: [
                { teamAId: { in: teamIds } },
                { teamBId: { in: teamIds } }
            ],
            status: "finished"
        },
        include: {
            teamA: true,
            teamB: true,
            league: true
        },
        orderBy: { week: 'desc' },
        take: 5
    });

    // Sanitize user object and add hasPassword flag
    const { password, ...safeUser } = user;
    const userWithFlag = {
        ...safeUser,
        hasPassword: !!password
    };

    return {
        user: userWithFlag,
        recentMatchups
    };
}

export async function updateProfile(data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    birthDate?: string;
    email?: string;
}) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: userId },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            bio: data.bio,
            avatarUrl: data.avatarUrl,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            email: data.email
        }
    });

    revalidatePath("/profile");
    return { success: true };
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    // If user has a password, verify it
    if (user.password) {
        const isValid = await compare(oldPassword, user.password);
        if (!isValid) {
            throw new Error("Incorrect old password");
        }
    } else {
        // If user has no password (OAuth only), maybe we require them to set one?
        // For now, let's assume if they don't have one, they can just set it (if we allow that flow)
        // But usually "Change Password" implies knowing the old one.
        // If they logged in via Yahoo, they might not have a password.
        // We'll allow setting it if it's null, otherwise require old password.
        if (oldPassword && oldPassword.length > 0) {
            // If they provided an old password but didn't have one set, that's weird but okay.
        }
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword
        }
    });

    return { success: true };
}
