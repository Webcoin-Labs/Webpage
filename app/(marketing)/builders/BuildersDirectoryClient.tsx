"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import type { BuilderProfile, User } from "@prisma/client";

type BuilderWithUser = BuilderProfile & { user: Pick<User, "id" | "name" | "image"> };

const SKILL_OPTIONS = ["Solidity", "Rust", "Move", "TypeScript", "React", "Smart Contracts", "DeFi", "NFT", "Gaming", "Infrastructure"];
const CHAIN_OPTIONS = ["Ethereum", "Base", "Solana", "Polygon", "Arbitrum", "Optimism", "Sui", "Aptos"];

export function BuildersDirectoryClient({ initialBuilders }: { initialBuilders: BuilderWithUser[] }) {
  const [skillFilter, setSkillFilter] = useState<string>("");
  const [chainFilter, setChainFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialBuilders.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = b.user.name?.toLowerCase().includes(q);
        const matchHandle = b.handle?.toLowerCase().includes(q);
        const matchBio = b.bio?.toLowerCase().includes(q);
        const matchSkills = b.skills.some((s) => s.toLowerCase().includes(q));
        const matchInterests = b.interests.some((i) => i.toLowerCase().includes(q));
        if (!matchName && !matchHandle && !matchBio && !matchSkills && !matchInterests) return false;
      }
      if (skillFilter && !b.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
      if (chainFilter && !b.interests.some((i) => i.toLowerCase().includes(chainFilter.toLowerCase())) && !b.bio?.toLowerCase().includes(chainFilter.toLowerCase())) return false;
      return true;
    });
  }, [initialBuilders, search, skillFilter, chainFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <input
          type="search"
          placeholder="Search by name, handle, skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <option value="">All skills</option>
            {SKILL_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <option value="">All chains</option>
            {CHAIN_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((builder, i) => (
          <AnimatedSection key={builder.id} delay={i * 0.03}>
            <Link
              href={builder.handle ? `/builders/${builder.handle}` : `/builders/${builder.user.id}`}
              className="block p-6 rounded-xl border border-border/50 bg-card hover:border-cyan-500/30 hover:bg-accent/20 transition-all h-full"
            >
              <div className="flex items-start gap-4 mb-3">
                {builder.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={builder.user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-lg font-bold text-cyan-400">
                    {builder.user.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold truncate">{builder.user.name ?? "Builder"}</h2>
                  {builder.headline && <p className="text-xs text-muted-foreground truncate">{builder.headline}</p>}
                </div>
              </div>
              {builder.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {builder.skills.slice(0, 4).map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {(builder.github || builder.twitter || builder.website) && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {builder.github && <span>GitHub</span>}
                  {builder.twitter && <span>Twitter</span>}
                  {builder.website && <span>Web</span>}
                </div>
              )}
            </Link>
          </AnimatedSection>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No builders match your filters.
        </div>
      )}
    </div>
  );
}
