"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function registerUser(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const username = formData.get("username") as string;
    const birthDateStr = formData.get("birthDate") as string;

    if (!email || !password || !firstName || !lastName || !username || !birthDateStr) {
        return { error: "Lütfen tüm alanları doldurun." };
    }

    // Username format kontrolü
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        return { error: "Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir. Boşluk içeremez." };
    }

    // E-posta kontrolü
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Bu e-posta adresi zaten kullanımda." };
    }

    // Username kontrolü
    const existingUsername = await prisma.user.findFirst({
        where: { username },
    });

    if (existingUsername) {
        return { error: "Bu kullanıcı adı zaten alınmış." };
    }

    // Şifre hashleme
    const hashedPassword = await hash(password, 10);

    // Doğum tarihi çevirme
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
        return { error: "Geçersiz doğum tarihi." };
    }

    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                username,
                birthDate,
                // E-posta doğrulama şimdilik manuel veya link ile yapılmalı
                // Biz şimdilik null bırakıyoruz, giriş yaparken kontrol edebiliriz
            },
        });
    } catch (error) {
        console.error("Registration Error:", error);
        return { error: "Kayıt oluşturulurken bir hata oluştu." };
    }

    // Başarılı kayıt sonrası yönlendirme
    redirect("/api/auth/signin?success=AccountCreated");
}

export async function deleteAccount() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    try {
        await prisma.user.delete({
            where: { email: session.user.email },
        });
        return { success: true };
    } catch (error) {
        console.error("Delete Account Error:", error);
        throw new Error("Failed to delete account");
    }
}
