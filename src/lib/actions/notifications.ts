"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function getUserNotifications() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return [];
    }

    const userId = (session.user as any).id;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return notifications;
    } catch (error) {
        console.error("Failed to fetch notifications", error);
        return [];
    }
}

export async function markAsRead(notificationId: string) {
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark notification as read", error);
        return { success: false };
    }
}

export async function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to create notification", error);
        return { success: false };
    }
}

export async function getAllNotifications() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return [];
    }

    const userId = (session.user as any).id;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        return notifications;
    } catch (error) {
        console.error("Failed to fetch all notifications", error);
        return [];
    }
}

export async function markAllAsRead() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false };
    const userId = (session.user as any).id;

    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        revalidatePath("/notifications");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark all as read", error);
        return { success: false };
    }
}

export async function deleteAllNotifications() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false };
    const userId = (session.user as any).id;

    try {
        await prisma.notification.deleteMany({
            where: { userId }
        });
        revalidatePath("/notifications");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete all notifications", error);
        return { success: false };
    }
}
