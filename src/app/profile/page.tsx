import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // Redirect to the dynamic user profile
    // If username is missing (edge case), fallback to dashboard or settings
    const targetUrl = session.user.username ? `/user/${session.user.username}` : "/dashboard";

    redirect(targetUrl);
}
