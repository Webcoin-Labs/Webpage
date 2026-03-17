import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { env } from "@/lib/env";

export { getServerSession };

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
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: credentials.login.trim().toLowerCase() },
                        { username: credentials.login.trim().toLowerCase() },
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
                role: user.role,
                onboardingComplete: user.onboardingComplete,
            } as { id: string; name: string | null; email: string; image: string | null; role: Role; onboardingComplete: boolean };
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
    adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
    providers,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                const u = user as { role?: Role; onboardingComplete?: boolean };
                token.role = u.role ?? "BUILDER";
                token.id = user.id;
                token.onboardingComplete = u.onboardingComplete ?? false;
                token.picture = user.image ?? token.picture;
            }
            // Refresh role and onboarding from DB when needed (works for OAuth and credentials)
            if (token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true, id: true, onboardingComplete: true, email: true, image: true },
                });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser.id;
                    token.onboardingComplete = dbUser.onboardingComplete;
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
            role: Role;
            onboardingComplete?: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: Role;
        id?: string;
        onboardingComplete?: boolean;
    }
}
