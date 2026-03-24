import Link from "next/link";
import { joinFounderChatByInvite } from "@/app/actions/founder-os";

type Params = {
  params: Promise<{ token: string }>;
};

export const metadata = {
  title: "Join Chat - Founder OS",
};

export default async function JoinFounderOsChatPage({ params }: Params) {
  const { token } = await params;
  const joinAction = async () => {
    "use server";
    await joinFounderChatByInvite(token);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h1 className="text-lg font-semibold">Join secure Founder OS chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This thread is linked to startup collaboration context.
        </p>
        <form action={joinAction} className="mt-4">
          <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
            Join chat
          </button>
        </form>
        <Link href="/app/founder-os" className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground">
          Back to Founder OS
        </Link>
      </div>
    </div>
  );
}
