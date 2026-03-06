import { ApplyForm } from "@/components/apply/ApplyForm";

export const metadata = { title: "Apply — Founder Support | Webcoin Labs" };

export default function FounderSupportApplyPage() {
  return (
    <ApplyForm
      title="Founder Support"
      description="Apply for advisory and capital readiness support."
      fixedType="FOUNDER_SUPPORT"
    />
  );
}
