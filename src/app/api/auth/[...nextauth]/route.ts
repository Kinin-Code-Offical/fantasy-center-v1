import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
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
            yahooId: profile.sub,
            username: null,
            credits: 1000,
            reputation: 50,
        };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
});

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
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
                    credits: user.credits,
                    reputation: user.reputation,
                    yahooId: user.yahooId,
                    username: user.username,
                };
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Adapter otomatik olarak Account oluşturur ve User ile bağlar.
            // Ekstra bir işlem yapmamıza gerek yok, ancak loglayabiliriz.
            console.log("SignIn Callback:", user.email, account?.provider);

            // --- HESAP BAĞLAMA (ACCOUNT LINKING) ---
            // Eğer kullanıcı zaten varsa ve farklı bir provider ile giriş yapıyorsa,
            // NextAuth varsayılan olarak "OAuthAccountNotLinked" hatası verir.
            // Bunu aşmak için manuel olarak hesabı bağlamamız gerekebilir veya
            // allowDangerousEmailAccountLinking: true ayarını kullanabiliriz (Provider ayarlarında).
            // Ancak burada manuel kontrol daha güvenlidir.

            if (account?.provider === "yahoo" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email }
                });

                if (existingUser) {
                    // Kullanıcı var, ancak bu provider ile bağlı mı?
                    const linkedAccount = await prisma.account.findFirst({
                        where: {
                            userId: existingUser.id,
                            provider: "yahoo"
                        }
                    });

                    if (!linkedAccount) {
                        // Bağlı değilse, manuel olarak bağla
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                refresh_token: account.refresh_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                session_state: account.session_state
                            }
                        });
                        return true; // Başarılı, devam et
                    }
                }
            }

            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            // 1. İlk Giriş Anı (Sign In)
            if (user) {
                token.id = user.id;
                // ÖNEMLİ: Base64 resim verisi cookie'yi patlatıyor (431 Hatası).
                // Bu yüzden token'dan resim verilerini siliyoruz.
                delete token.picture;
                delete token.image;
            }

            // 2. Session Update (Client tarafında update() çağrıldığında)
            if (trigger === "update" && session) {
                // Sadece isim gibi küçük verileri güncelleyebiliriz
                // Resim verisini ASLA token'a almıyoruz
            }

            // 3. Sonraki İstekler (Token zaten var)
            // Veritabanından güncel bilgileri çekip token'ı tazeleyelim
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: {
                        username: true,
                        credits: true,
                        reputation: true,
                        yahooId: true
                    }
                });

                if (dbUser) {
                    token.username = dbUser.username;
                    token.credits = dbUser.credits;
                    token.reputation = dbUser.reputation;
                    token.yahooId = dbUser.yahooId;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                (session.user as any).id = token.id;
                (session.user as any).yahooId = token.yahooId;
                (session.user as any).username = token.username;
                (session.user as any).credits = token.credits;
                (session.user as any).reputation = token.reputation;

                // Avatar URL'i token yerine doğrudan DB'den çekiyoruz (Cookie şişmesini önlemek için)
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { avatarUrl: true }
                });

                if (!dbUser) {
                    // Kullanıcı veritabanından silinmişse oturumu sonlandır
                    return null as any;
                }

                if (dbUser) {
                    (session.user as any).avatarUrl = dbUser.avatarUrl;
                }
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: true,
    events: {
        async signIn({ user, account, profile, isNewUser }) {
            if (account?.provider === "yahoo") {
                try {
                    const fullName = user.name || "";
                    const nameParts = fullName.split(" ");
                    const firstName = nameParts[0] || "";
                    const lastName = nameParts.slice(1).join(" ") || "";

                    // Mevcut kullanıcı verilerini kontrol et
                    const currentUser = await prisma.user.findUnique({
                        where: { id: user.id },
                        select: { avatarUrl: true, firstName: true, lastName: true }
                    });

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            firstName: currentUser?.firstName || firstName, // Mevcut varsa koru
                            lastName: currentUser?.lastName || lastName,
                            yahooId: account.providerAccountId,
                            // Sadece avatarUrl boşsa Yahoo resmini kullan, aksi takdirde mevcut olanı koru
                            avatarUrl: currentUser?.avatarUrl || user.image,
                            emailVerified: new Date() // Yahoo ile giriş güvenlidir
                        }
                    });
                } catch (e) {
                    console.error("Error updating user details in signIn event", e);
                }
            }
        }
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };