import NextAuth, { NextAuthOptions } from "next-auth";
import { OAuthConfig } from "next-auth/providers/oauth"; // <--- BU SATIRI EKLEDİK (TİP TANIMI)
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// --- MÜHENDİSLİK ÇÖZÜMÜ: CUSTOM YAHOO PROVIDER ---
// Fonksiyonun dönüş tipini (: OAuthConfig<any>) belirterek TypeScript'i susturuyoruz.
const CustomYahooProvider = (options: { clientId: string; clientSecret: string }): OAuthConfig<any> => ({
    id: "yahoo",
    name: "Yahoo",
    type: "oauth", // 'as const' gerekmez, yukarıdaki tip tanımı halleder
    wellKnown: "https://api.login.yahoo.com/.well-known/openid-configuration",
    authorization: {
        params: {
            scope: "openid profile email fspt-r",
            prompt: "consent",
            response_type: "code"
        }
    },
    idToken: true,
    checks: ["pkce", "state"],
    client: {
        id_token_signed_response_alg: "ES256",
    },
    profile(profile: any) {
        return {
            id: profile.sub,
            name: profile.name || profile.given_name,
            email: profile.email,
            image: profile.picture,
        };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
});

export const authOptions: NextAuthOptions = {
    providers: [
        CustomYahooProvider({
            clientId: process.env.YAHOO_CLIENT_ID!,
            clientSecret: process.env.YAHOO_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email ve şifre gereklidir.");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Kullanıcı bulunamadı veya şifre hatalı.");
                }

                const isPasswordValid = await compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Şifre hatalı.");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    image: user.avatarUrl,
                };
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("SignIn Callback Started");
            console.log("User:", user);
            console.log("Account:", account);

            if (!account || !user) {
                console.error("Missing account or user data");
                return false;
            }

            // Credentials provider ile giriş yapılıyorsa, authorize fonksiyonu zaten doğrulama yaptı.
            // Veritabanı güncellemesine gerek yok.
            if (account.provider === "credentials") {
                return true;
            }

            try {
                console.log("Attempting DB Upsert...");

                // İsim ayrıştırma (Best Effort)
                const fullName = user.name || "";
                const nameParts = fullName.split(" ");
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";

                // 1. Önce Yahoo ID ile kullanıcı var mı diye bak
                let dbUser = await prisma.user.findUnique({
                    where: { yahooId: user.id }
                });

                // 2. Yoksa, Email ile var mı diye bak (Hesap Bağlama Senaryosu)
                if (!dbUser && user.email) {
                    dbUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });
                }

                if (dbUser) {
                    // --- GÜNCELLEME (UPDATE) ---
                    console.log("User found, updating tokens...");
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: {
                            yahooId: user.id, // Eğer email ile bulduysak Yahoo ID'yi ekle (Bağla)
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            tokenExpires: account.expires_at ? BigInt(account.expires_at) : null,
                            // İsim ve avatarı güncelle (Yahoo verisi öncelikli)
                            firstName: firstName || dbUser.firstName,
                            lastName: lastName || dbUser.lastName,
                            avatarUrl: user.image || dbUser.avatarUrl,
                            emailVerified: dbUser.emailVerified || new Date(), // Yahoo güvenilirdir
                        },
                    });
                } else {
                    // --- YENİ KAYIT (CREATE) ---
                    console.log("User not found, creating new...");

                    // Yahoo bazen email döndürmez, bu durumda unique bir placeholder oluşturuyoruz.
                    const emailToUse = user.email || `yahoo_${user.id}@no-email.com`;

                    await prisma.user.create({
                        data: {
                            yahooId: user.id,
                            email: emailToUse,
                            firstName: firstName,
                            lastName: lastName,
                            avatarUrl: user.image,
                            accessToken: account.access_token,
                            refreshToken: account.refresh_token,
                            tokenExpires: account.expires_at ? BigInt(account.expires_at) : null,
                            emailVerified: new Date(), // Yahoo ile gelen email doğrulanmıştır
                        },
                    });
                }

                console.log("DB Operation Successful");
                return true;
            } catch (error) {
                console.error("DB Login Error Detailed:", error);
                return false;
            }
        },
        async jwt({ token, user, account, trigger, session }) {
            // 1. İlk Giriş Anı (Sign In)
            if (user && account) {
                let dbUser;

                if (account.provider === "credentials") {
                    // Credentials provider zaten DB ID'sini user.id olarak döndürüyor
                    dbUser = await prisma.user.findUnique({
                        where: { id: user.id }
                    });
                } else {
                    // Yahoo (veya diğer OAuth) provider ID'sini user.id olarak döndürüyor
                    // Önce Yahoo ID ile kullanıcı var mı diye bak
                    dbUser = await prisma.user.findUnique({
                        where: { yahooId: user.id }
                    });

                    // Yoksa, Email ile var mı diye bak (Hesap Bağlama)
                    if (!dbUser && user.email) {
                        dbUser = await prisma.user.findUnique({
                            where: { email: user.email }
                        });
                    }
                }

                if (dbUser) {
                    token.id = dbUser.id;
                    token.yahooId = dbUser.yahooId;
                    token.username = dbUser.username;
                    token.role = "USER"; // İleride admin rolü eklenebilir
                }
            }

            // 2. Sonraki İstekler (Token zaten var)
            // Veritabanından güncel bilgileri çekip token'ı tazeleyelim
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { username: true, credits: true, reputation: true, avatarUrl: true }
                });

                if (dbUser) {
                    token.username = dbUser.username;
                    token.credits = dbUser.credits;
                    token.reputation = dbUser.reputation;
                    token.avatarUrl = dbUser.avatarUrl;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).yahooId = token.yahooId;
                (session.user as any).username = token.username;
                (session.user as any).credits = token.credits;
                (session.user as any).reputation = token.reputation;
                (session.user as any).avatarUrl = token.avatarUrl;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };