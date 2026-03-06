import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BuilderProfileForm } from "@/components/app/BuilderProfileForm";
import { FounderProfileForm } from "@/components/app/FounderProfileForm";

export const metadata = { title: "Profile — Webcoin Labs" };

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    const user = session!.user;

    const [builderProfile, founderProfile] = await Promise.all([
        prisma.builderProfile.findUnique({ where: { userId: user.id } }),
        prisma.founderProfile.findUnique({ where: { userId: user.id } }),
    ]);

    return (
        <div className="space-y-6 py-8">
            <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-1">
                    Your {user.role === "FOUNDER" ? "founder" : "builder"} profile visible to the Webcoin Labs team.
                </p>
            </div>

            {user.role === "BUILDER" && (
                <BuilderProfileForm initial={builderProfile} />
            )}
            {user.role === "FOUNDER" && (
                <FounderProfileForm initial={founderProfile} />
            )}
            {user.role !== "BUILDER" && user.role !== "FOUNDER" && (
                <div className="p-6 rounded-xl border border-border/50 bg-card text-sm text-muted-foreground">
                    Profile setup is available for Builder and Founder roles.
                </div>
            )}
        </div>
    );
}
