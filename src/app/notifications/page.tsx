import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getAllNotifications } from "@/lib/actions/notifications";
import NotificationsInterface from "./NotificationsInterface";

import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    // Security Check: Verify Identity
    if (session?.user?.email) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { emailVerified: true }
        });

        if (user && !user.emailVerified) {
            redirect("/settings");
        }
    }

    const notifications = await getAllNotifications();

    return (
        <NotificationsInterface
            initialNotifications={notifications}
            username={session.user.name || "UNKNOWN_USER"}
        />
    );
}
