import type { LucideIcon } from "lucide-react";

export function ProfileEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[16px] px-6 py-12 text-center"
      style={{
        background: "repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.007) 10px, rgba(255,255,255,0.007) 11px)",
        border: "0.5px dashed #27272a",
      }}
    >
      {Icon ? (
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: "#111114", border: "0.5px solid #27272a" }}
        >
          <Icon className="h-5 w-5" style={{ color: "#3f3f46" }} />
        </div>
      ) : null}
      <p className="text-[14px] font-semibold" style={{ color: "#52525b" }}>
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-[280px] text-[12px] leading-5" style={{ color: "#3f3f46" }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
