import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getAllNotifications } from "@/lib/actions/notifications";
import NotificationsInterface from "./NotificationsInterface";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect("/login");
    }

    const notifications = await getAllNotifications();

    return (
        <NotificationsInterface
            initialNotifications={notifications}
            username={session.user.name || "UNKNOWN_USER"}
        />
    );
}
