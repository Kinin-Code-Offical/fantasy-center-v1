"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollowPlayer(playerId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const existingFollow = await prisma.playerFollow.findUnique({
        where: {
            userId_playerId: {
                userId: user.id,
                playerId: playerId,
            },
        },
    });

    if (existingFollow) {
        await prisma.playerFollow.delete({
            where: {
                id: existingFollow.id,
            },
        });
    } else {
        await prisma.playerFollow.create({
            data: {
                userId: user.id,
                playerId: playerId,
            },
        });
    }

    revalidatePath(`/player/${playerId}`);
}

export async function postComment(playerId: string, content: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (!content || content.trim() === "") {
        throw new Error("Comment cannot be empty");
    }

    await prisma.comment.create({
        data: {
            content: content,
            userId: user.id,
            playerId: playerId,
        },
    });

    revalidatePath(`/player/${playerId}`);
}
