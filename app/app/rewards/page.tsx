import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { RewardsList } from "./RewardsList";

export const metadata = { title: "Rewards — Webcoin Labs" };

export default async function RewardsPage() {
  const session = await getServerSession();
  const rewards = await db.reward.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="text-muted-foreground mt-1">Pending credits or rewards assigned to you. Claim to mark as received (no on-chain transfer).</p>
      </div>
      <RewardsList rewards={rewards} />
    </div>
  );
}

