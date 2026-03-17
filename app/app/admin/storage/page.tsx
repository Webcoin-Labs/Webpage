import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AdminStorageHealthCheck } from "@/components/app/AdminStorageHealthCheck";

export const metadata = { title: "Storage Health — Admin | Webcoin Labs" };

export default async function AdminStoragePage() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/app");

  return (
    <div className="space-y-6 py-8">
      <Link href="/app/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Admin
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Storage</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Validate active storage credentials and object operations from within the app.
        </p>
      </div>
      <AdminStorageHealthCheck />
    </div>
  );
}
