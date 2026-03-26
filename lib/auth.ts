import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/server/db/client";
import { Role } from "@prisma/client";
import { env } from "@/lib/env";

export { getServerSession };

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
        id: "credentials",
        name: "Email or username",
        credentials: {
            login: { label: "Email or username", type: "text" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            if (!credentials?.login || !credentials?.password) return null;
            const loginRaw = credentials.login.trim().replace(/^@+/, "");
            const loginLower = loginRaw.toLowerCase();
            const user = await db.user.findFirst({
                where: {
                    OR: [
                        { email: loginLower },
                        { username: loginRaw },
                        { username: loginLower },
                        { username: { equals: loginRaw, mode: "insensitive" } },
                    ],
                },
            });
            if (!user?.password) return null;
            const ok = await compare(credentials.password, user.password);
            if (!ok) return null;
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                username: user.username,
                role: user.role,
                onboardingComplete: user.onboardingComplete,
            } as { id: string; name: string | null; email: string; image: string | null; username: string | null; role: Role; onboardingComplete: boolean };
        },
    }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.unshift(
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        })
    );
}
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.unshift(
        GitHubProvider({
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        })
    );
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
    providers,
    session: {
        strategy: "jwt",
        // Force re-login every 24 hours
        maxAge: SESSION_MAX_AGE_SECONDS,
    },
    jwt: {
        maxAge: SESSION_MAX_AGE_SECONDS,
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            try {
                const target = new URL(url);
                if (target.origin === baseUrl) return url;
            } catch {
                return `${baseUrl}/app`;
            }
            return `${baseUrl}/app`;
        },
        async jwt({ token, user }) {
            const nowSeconds = Math.floor(Date.now() / 1000);
            // Enforce a hard 24h lifetime (not sliding) from the initial login time.
            const issuedAtSeconds =
                typeof token.loginAt === "number"
                    ? Math.floor(token.loginAt / 1000)
                    : typeof token.iat === "number"
                      ? token.iat
                      : undefined;

            if (issuedAtSeconds && nowSeconds - issuedAtSeconds > SESSION_MAX_AGE_SECONDS) {
                return null as any;
            }

            if (user) {
                const u = user as { role?: Role; onboardingComplete?: boolean; username?: string | null };
                token.role = u.role ?? "BUILDER";
                token.id = user.id;
                token.onboardingComplete = u.onboardingComplete ?? false;
                token.username = u.username ?? null;
                token.picture = user.image ?? token.picture;
                token.loginAt = Date.now();
            }
            // Refresh role and onboarding from DB when needed (works for OAuth and credentials)
            if (token.id) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true, id: true, onboardingComplete: true, email: true, image: true, username: true },
                });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser.id;
                    token.onboardingComplete = dbUser.onboardingComplete;
                    token.username = dbUser.username;
                    if (dbUser.email) token.email = dbUser.email;
                    token.picture = dbUser.image ?? token.picture;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as Role;
                session.user.id = token.id as string;
                session.user.onboardingComplete = token.onboardingComplete as boolean;
                session.user.username = (token.username as string | null | undefined) ?? null;
                session.user.image = (token.picture as string | null | undefined) ?? session.user.image;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            username?: string | null;
            role: Role;
            onboardingComplete?: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: Role;
        id?: string;
        username?: string | null;
        onboardingComplete?: boolean;
        loginAt?: number;
    }
}

