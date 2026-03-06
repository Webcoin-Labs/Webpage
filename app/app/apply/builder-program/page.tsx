import { ApplyForm } from "@/components/apply/ApplyForm";

export const metadata = { title: "Apply — Builder Program | Webcoin Labs" };

export default function BuilderProgramApplyPage() {
  return (
    <ApplyForm
      title="Builder Program"
      description="Apply to join a builder cohort. We review within 5 business days."
      fixedType="BUILDER_PROGRAM"
    />
  );
}
