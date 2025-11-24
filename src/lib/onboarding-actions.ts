"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";

const OnboardingSchema = z.object({
    username: z.string()
        .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
        .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı sadece harf, rakam, alt çizgi (_) ve tire (-) içerebilir. Boşluk içeremez."),
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
    birthDate: z.string().refine((date) => new Date(date).toString() !== 'Invalid Date', {
        message: "Geçerli bir tarih giriniz.",
    }),
    password: z.string().optional(),
});

export type OnboardingState = {
    error?: {
        username?: string[];
        firstName?: string[];
        lastName?: string[];
        birthDate?: string[];
        password?: string[];
        form?: string[];
    };
};

export async function completeOnboarding(prevState: OnboardingState | null, formData: FormData): Promise<OnboardingState> {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return { error: { form: ["Oturum açmanız gerekiyor."] } };
    }

    const rawData = {
        username: formData.get("username"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthDate: formData.get("birthDate"),
        password: formData.get("password"),
    };

    const validated = OnboardingSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let hashedPassword = undefined;
    if (validated.data.password && validated.data.password.length > 0) {
        if (validated.data.password.length < 6) {
            return { error: { password: ["Şifre en az 6 karakter olmalıdır."] } };
        }
        hashedPassword = await hash(validated.data.password, 10);
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                username: validated.data.username,
                firstName: validated.data.firstName,
                lastName: validated.data.lastName,
                birthDate: new Date(validated.data.birthDate),
                ...(hashedPassword && { password: hashedPassword }),
            },
        });
    } catch (error) {
        console.error("Onboarding update error:", error);
        return { error: { form: ["Güncelleme sırasında bir hata oluştu. Kullanıcı adı alınmış olabilir."] } };
    }

    redirect("/");
}
