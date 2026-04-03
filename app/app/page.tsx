import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export default async function AppEntryPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fapp");
  }

  const { role, onboardingComplete } = session.user;

  // Keep onboarding flow intact: users who haven't finished setup continue there.
  if (onboardingComplete === false) {
    redirect("/app/onboarding");
  }

  if (role === "FOUNDER") {
    redirect("/app/founder-os");
  }

  if (role === "INVESTOR") {
    redirect("/app/investor-os");
  }

  if (role === "ADMIN") {
    redirect("/app/admin");
  }

  redirect("/app/builder-os");
}
