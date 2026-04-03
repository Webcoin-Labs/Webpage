"use client";

import { useState } from "react";

export type ProfileTab = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export function PublicProfileTabs({
  tabs,
  accent,
}: {
  tabs: ProfileTab[];
  accent?: string;
}) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "");

  const color = accent ?? "#a78bfa";
  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <div>
      {/* ─── Tab Bar ─── */}
      <nav
        className="flex items-center gap-0.5 overflow-x-auto rounded-[12px] p-[3px]"
        style={{ backgroundColor: "#0a0a0c", border: "0.5px solid #1a1a1e", scrollbarWidth: "none" }}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className="shrink-0 rounded-[9px] px-3.5 py-[7px] text-[12px] font-medium transition-all duration-100 focus-visible:outline-none"
              style={{
                backgroundColor: isActive ? "#131316" : "transparent",
                color: isActive ? color : "#52525b",
                boxShadow: isActive ? `inset 0 0 0 0.5px ${color}35, 0 1px 4px rgba(0,0,0,0.5)` : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ─── Tab Content ─── */}
      <div className="mt-3">{activeTab?.content}</div>
    </div>
  );
}
