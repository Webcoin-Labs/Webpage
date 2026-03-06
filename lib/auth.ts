import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export { getServerSession };
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
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
            }
            // Refresh role and onboarding from DB when needed
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { role: true, id: true, onboardingComplete: true },
                });
                if (dbUser) {
                    token.role = token.role ?? dbUser.role;
                    token.id = dbUser.id;
                    token.onboardingComplete = dbUser.onboardingComplete;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as Role;
                session.user.id = token.id as string;
                session.user.onboardingComplete = token.onboardingComplete as boolean;
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
