import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { redeemProjectAdvisorInvite } from "@/app/actions/advisor";

export const metadata = { title: "Advisor Invite - Webcoin Labs" };

export default async function AdvisorInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/advisor/invite/${token}`)}`);

  const redeemAction = async (formData: FormData) => {
    "use server";
    const inviteToken = String(formData.get("token") ?? "");
    await redeemProjectAdvisorInvite(inviteToken);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 py-10">
      <section className="rounded-xl border border-border/60 bg-card p-6">
        <h1 className="text-xl font-semibold">Advisor Invite</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Redeem this invite to unlock advisor profile setup and project connection.
        </p>
        <form action={redeemAction} className="mt-4 space-y-3">
          <input
            name="token"
            defaultValue={token.toUpperCase()}
            readOnly
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
            Redeem invite
          </button>
        </form>
        <Link href="/advisor" className="mt-3 inline-flex text-xs text-cyan-300">
          Go to advisor workspace
        </Link>
      </section>
    </div>
  );
}
