import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            yahooId: string
            username: string
            credits: number
            reputation: number
            avatarUrl?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        yahooId?: string | null
        username?: string | null
        credits: number
        reputation: number
        avatarUrl?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        yahooId?: string | null
        username?: string | null
        credits: number
        reputation: number
        avatarUrl?: string | null
    }
}
