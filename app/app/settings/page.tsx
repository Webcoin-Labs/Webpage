import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SettingsForm } from "@/components/app/SettingsForm";

export const metadata = { title: "Settings — Webcoin Labs" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <SettingsForm
        currentRole={user.role}
        email={user.email ?? undefined}
        name={user.name ?? undefined}
      />
    </div>
  );
}
