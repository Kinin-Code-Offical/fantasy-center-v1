"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

import { hash, compare } from "bcryptjs";

export async function updateUserProfile(formData: FormData) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    const username = formData.get("username") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const bio = formData.get("bio") as string;
    const avatarUrl = formData.get("avatarUrl") as string;
    const email = formData.get("email") as string;
    const birthDateRaw = formData.get("birthDate") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Basic validation
    if (username) {
        if (username.length < 3) {
            return { success: false, message: "Username must be at least 3 characters." };
        }

        // URL-friendly validation: Alphanumeric, underscores, and hyphens only. No spaces.
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return { success: false, message: "Username can only contain letters, numbers, underscores, and hyphens." };
        }
    }

    // Date Validation
    let birthDateToUpdate: Date | null | undefined = undefined;
    if (birthDateRaw) {
        birthDateToUpdate = new Date(birthDateRaw);
    } else if (birthDateRaw === "") {
        birthDateToUpdate = null;
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, message: "User not found" };

        // Check if username is taken by another user
        if (username && username !== user.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: {
                        equals: username,
                        mode: 'insensitive'
                    },
                    NOT: {
                        id: userId
                    }
                }
            });

            if (existingUser) {
                return { success: false, message: "Username is already taken." };
            }
        }

        // Email Update Logic
        if (email && email !== user.email) {
            const existingEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (existingEmail) {
                return { success: false, message: "Email is already in use." };
            }
        }

        // Password Update Logic
        let hashedPassword = undefined;
        if (newPassword) {
            if (!currentPassword) {
                return { success: false, message: "Current password is required to set a new password." };
            }
            if (newPassword !== confirmPassword) {
                return { success: false, message: "New passwords do not match." };
            }
            if (newPassword.length < 6) {
                return { success: false, message: "Password must be at least 6 characters." };
            }

            // Verify current password
            if (user.password) {
                const isValid = await compare(currentPassword, user.password);
                if (!isValid) {
                    return { success: false, message: "Incorrect current password." };
                }
            }

            hashedPassword = await hash(newPassword, 12);
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                username: username || undefined,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                bio: bio || undefined,
                avatarUrl: avatarUrl || undefined,
                email: email || undefined,
                password: hashedPassword || undefined,
                birthDate: birthDateToUpdate,
            }
        });

        revalidatePath(`/user/${username}`);
        revalidatePath("/profile");

        return { success: true, message: "Profile updated successfully." };
    } catch (error) {
        console.error("Profile update error:", error);
        return { success: false, message: "Failed to update profile." };
    }
}