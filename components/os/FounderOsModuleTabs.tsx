"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { founderModules } from "@/lib/os/modules";

const dashboardTab = { slug: "", title: "Dashboard" };

export function FounderOsModuleTabs({
  rootHref,
}: {
  rootHref: string;
}) {
  const pathname = usePathname();
  const allTabs = [dashboardTab, ...founderModules];

  return (
    <nav
      className="overflow-x-auto pb-[10px] mb-[14px]"
      style={{ borderBottom: "0.5px solid #1a1a1e", scrollbarWidth: "none" }}
    >
      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex gap-[2px]" style={{ whiteSpace: "nowrap" }}>
        {allTabs.map((tab) => {
          const href = tab.slug ? `${rootHref}/${tab.slug}` : rootHref;
          const isActive = tab.slug
            ? pathname.startsWith(`${rootHref}/${tab.slug}`)
            : pathname === rootHref;

          return (
            <Link
              key={tab.slug || "dashboard"}
              href={href}
              className="px-3 py-1 rounded-md text-[10px] font-medium transition-colors duration-150 whitespace-nowrap"
              style={{
                backgroundColor: isActive ? "#1a1030" : "transparent",
                color: isActive ? "#a78bfa" : "#52525b",
                boxShadow: isActive ? "inset 0 -2px 0 #7c3aed" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#111114";
                  e.currentTarget.style.color = "#a1a1aa";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#52525b";
                }
              }}
            >
              {tab.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
