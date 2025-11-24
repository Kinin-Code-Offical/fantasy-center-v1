import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function assertVerified() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  
  // Fetch fresh user data to check verification status
  const user = await prisma.user.findUnique({ 
    where: { id: (session.user as any).id } 
  });
  
  if (!user?.emailVerified) {
    throw new Error("SECURITY ALERT: Identity not verified. Access denied.");
  }
  
  return user;
}
