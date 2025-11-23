"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const birthDateStr = formData.get("birthDate") as string;

    if (!email || !password || !firstName || !lastName || !birthDateStr) {
        return { error: "Lütfen tüm alanları doldurun." };
    }

    // E-posta kontrolü
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Bu e-posta adresi zaten kullanımda." };
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
