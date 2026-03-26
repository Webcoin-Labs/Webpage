import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";

export const metadata = { title: "Ecosystem Feed - Webcoin Labs" };

export default async function EcosystemFeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const resolved = await searchParams;
  return (
    <div className="space-y-4 py-6">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">Ecosystem Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real founder, builder, and investor activity across Webcoin Labs.
        </p>
      </section>
      <EcosystemFeedPanel basePath="/app/ecosystem-feed" search={resolved?.search} scope={resolved?.scope} viewerRole={session.user.role} />
    </div>
  );
}
