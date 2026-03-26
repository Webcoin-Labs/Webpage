"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { generateAiTokenomicsScenario, rollbackTokenomicsScenarioRevision, upsertAllocationRows } from "@/app/actions/founder-os-expansion";

type VentureOption = { id: string; name: string };
type Revision = { id: string; revisionNumber: number };
type AllocationRow = {
  id: string;
  label: string;
  percentage: number | null;
  tokenAmount: number | null;
  cliffMonths: number | null;
  vestingMonths: number | null;
  unlockCadence: string | null;
  notes: string | null;
};
type Scenario = {
  id: string;
  name: string;
  revisions: Revision[];
  allocations: AllocationRow[];
};
type Model = {
  id: string;
  name: string;
  tokenSymbol: string | null;
  totalSupply: number;
  notes: string | null;
  ventureName: string;
  scenarios: Scenario[];
};

function pct(rows: AllocationRow[]) {
  return rows.reduce((sum, row) => sum + (row.percentage ?? 0), 0);
}

function num(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function TokenomicsStudioClient({
  ventures,
  initialModels,
}: {
  ventures: VentureOption[];
  initialModels: Model[];
}) {
  const router = useRouter();
  const [models, setModels] = useState(initialModels);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wizard, setWizard] = useState({
    ventureId: ventures[0]?.id ?? "",
    tokenSymbol: "TOKEN",
    totalSupply: "1000000000",
    projectCategory: "Protocol",
    launchGoal: "TGE",
    fundraisingPlan: "Seed",
    communityPriority: "medium",
  });

  const loadingMessages = useMemo(
    () => [
      "Mapping a defensible allocation baseline",
      "Balancing team, treasury, community, and investor unlocks",
      "Drafting vesting defaults you can edit inline",
    ],
    [],
  );

  const updateScenarioRows = (scenarioId: string, updater: (rows: AllocationRow[]) => AllocationRow[]) => {
    setModels((current) =>
      current.map((model) => ({
        ...model,
        scenarios: model.scenarios.map((scenario) =>
          scenario.id === scenarioId ? { ...scenario, allocations: updater(scenario.allocations) } : scenario,
        ),
      })),
    );
  };

  const handleGenerate = () => {
    setError("");
    setSuccess("");
    startGenerating(async () => {
      try {
        const formData = new FormData();
        Object.entries(wizard).forEach(([key, value]) => formData.set(key, value));
        const created = await generateAiTokenomicsScenario(formData);
        setModels((current) => [
          {
            id: created.modelId,
            name: created.modelName,
            tokenSymbol: created.tokenSymbol,
            totalSupply: created.totalSupply,
            notes: created.notes,
            ventureName: created.ventureName,
            scenarios: [
              {
                id: created.scenarioId,
                name: created.scenarioName,
                revisions: [],
                allocations: created.rows.map((row, index) => ({
                  id: `${created.scenarioId}-${index}`,
                  label: row.label,
                  percentage: row.percentage ?? null,
                  tokenAmount: row.tokenAmount ?? null,
                  cliffMonths: row.cliffMonths ?? null,
                  vestingMonths: row.vestingMonths ?? null,
                  unlockCadence: row.unlockCadence ?? null,
                  notes: row.notes ?? null,
                })),
              },
            ],
          },
          ...current,
        ]);
        setSuccess("AI tokenomics draft generated. Edit the allocation table below.");
        router.refresh();
      } catch (generationError) {
        setError(generationError instanceof Error ? generationError.message : "Unable to generate tokenomics draft.");
      }
    });
  };

  const handleSaveScenario = (scenarioId: string, rows: AllocationRow[]) => {
    setError("");
    setSuccess("");
    startSaving(async () => {
      const formData = new FormData();
      formData.set("scenarioId", scenarioId);
      formData.set("revisionReason", "studio_inline_edit");
      formData.set(
        "rowsJson",
        JSON.stringify(
          rows.map((row) => ({
            label: row.label,
            percentage: row.percentage ?? undefined,
            tokenAmount: row.tokenAmount ?? undefined,
            cliffMonths: row.cliffMonths ?? undefined,
            vestingMonths: row.vestingMonths ?? undefined,
            unlockCadence: row.unlockCadence ?? undefined,
            notes: row.notes ?? undefined,
          })),
        ),
      );
      const result = await upsertAllocationRows(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Tokenomics scenario saved.");
      router.refresh();
    });
  };

  const handleRollback = (revisionId: string) => {
    setError("");
    setSuccess("");
    startSaving(async () => {
      const formData = new FormData();
      formData.set("revisionId", revisionId);
      const result = await rollbackTokenomicsScenarioRevision(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Scenario rolled back to selected revision.");
      router.refresh();
    });
  };

  return (
    <section className="space-y-5">
      <article className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI tokenomics generator
            </p>
            <h2 className="mt-3 text-xl font-semibold">Generate a professional first draft from a few inputs</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              Tell the studio what you are launching, your token symbol, total supply, and the kind of go-to-market posture you want.
              The system will draft allocations and vesting, then you can edit everything here on the same page.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-xs text-muted-foreground">
            Less input, faster draft
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select
            value={wizard.ventureId}
            onChange={(event) => setWizard((current) => ({ ...current, ventureId: event.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            {ventures.map((venture) => (
              <option key={venture.id} value={venture.id}>
                {venture.name}
              </option>
            ))}
          </select>
          <input
            value={wizard.tokenSymbol}
            onChange={(event) => setWizard((current) => ({ ...current, tokenSymbol: event.target.value.toUpperCase() }))}
            placeholder="Token symbol"
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          />
          <input
            value={wizard.totalSupply}
            onChange={(event) => setWizard((current) => ({ ...current, totalSupply: event.target.value }))}
            placeholder="Total supply"
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          />
          <select
            value={wizard.projectCategory}
            onChange={(event) => setWizard((current) => ({ ...current, projectCategory: event.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            <option>Protocol</option>
            <option>Consumer</option>
            <option>DeFi</option>
            <option>Infra</option>
            <option>Gaming</option>
            <option>AI x Crypto</option>
          </select>
          <select
            value={wizard.launchGoal}
            onChange={(event) => setWizard((current) => ({ ...current, launchGoal: event.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            <option value="TGE">TGE soon</option>
            <option value="Foundation">Foundation first</option>
            <option value="Ecosystem">Ecosystem growth</option>
          </select>
          <select
            value={wizard.fundraisingPlan}
            onChange={(event) => setWizard((current) => ({ ...current, fundraisingPlan: event.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            <option value="Seed">Seed round</option>
            <option value="Institutional">Institutional raise</option>
            <option value="Bootstrapped">Bootstrapped</option>
            <option value="Community">Community-led</option>
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <select
            value={wizard.communityPriority}
            onChange={(event) => setWizard((current) => ({ ...current, communityPriority: event.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            <option value="low">Lower community allocation</option>
            <option value="medium">Balanced community allocation</option>
            <option value="high">High community allocation</option>
          </select>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-200"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate draft
          </button>
        </div>

        {isGenerating ? (
          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              <div>
                <p className="text-sm font-semibold text-cyan-100">Generating tokenomics draft</p>
                <p className="text-xs text-cyan-200/70">This stays conservative and editable. It is a first-pass model, not a final cap table.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {loadingMessages.map((message) => (
                <div key={message} className="rounded-xl border border-border/40 bg-background/40 px-3 py-3 text-xs text-muted-foreground">
                  {message}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
      </article>

      {models.length === 0 ? (
        <article className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">Generate your first tokenomics draft to start editing allocations here.</p>
        </article>
      ) : null}

      {models.map((model) => (
        <article key={model.id} className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">{model.name} {model.tokenSymbol ? `(${model.tokenSymbol})` : ""}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Venture: {model.ventureName} · Total supply: {model.totalSupply.toLocaleString()}
              </p>
              {model.notes ? <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">{model.notes}</p> : null}
            </div>
          </div>

          {model.scenarios.map((scenario) => {
            const totalPercent = pct(scenario.allocations);
            return (
              <div key={scenario.id} id={scenario.id} className="mt-5 rounded-2xl border border-border/50 bg-background/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Allocation total: {totalPercent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`/api/tokenomics/${scenario.id}/export?format=csv`} className="rounded-lg border border-border px-3 py-2 text-xs text-cyan-300">
                      Export CSV
                    </a>
                    <a href={`/api/tokenomics/${scenario.id}/export?format=xlsx`} className="rounded-lg border border-border px-3 py-2 text-xs text-cyan-300">
                      Export XLSX
                    </a>
                    <button
                      type="button"
                      onClick={() => handleSaveScenario(scenario.id, scenario.allocations)}
                      disabled={isSaving}
                      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
                    >
                      Save edits
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        <th className="px-2 py-1">Bucket</th>
                        <th className="px-2 py-1">%</th>
                        <th className="px-2 py-1">Cliff</th>
                        <th className="px-2 py-1">Vesting</th>
                        <th className="px-2 py-1">Cadence</th>
                        <th className="px-2 py-1">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenario.allocations.map((row, index) => (
                        <tr key={row.id} className="rounded-xl bg-card">
                          <td className="px-2 py-2">
                            <input
                              value={row.label}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry),
                                )
                              }
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.percentage ?? ""}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, percentage: num(event.target.value) } : entry,
                                  ),
                                )
                              }
                              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.cliffMonths ?? ""}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, cliffMonths: num(event.target.value) } : entry,
                                  ),
                                )
                              }
                              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.vestingMonths ?? ""}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, vestingMonths: num(event.target.value) } : entry,
                                  ),
                                )
                              }
                              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.unlockCadence ?? ""}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, unlockCadence: event.target.value } : entry,
                                  ),
                                )
                              }
                              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={row.notes ?? ""}
                              onChange={(event) =>
                                updateScenarioRows(scenario.id, (rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, notes: event.target.value } : entry,
                                  ),
                                )
                              }
                              className="w-full min-w-[220px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateScenarioRows(scenario.id, (rows) => [
                        ...rows,
                        {
                          id: `${scenario.id}-${rows.length}`,
                          label: "",
                          percentage: null,
                          tokenAmount: null,
                          cliffMonths: 0,
                          vestingMonths: 0,
                          unlockCadence: "Monthly",
                          notes: "",
                        },
                      ])
                    }
                    className="rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    Add bucket
                  </button>
                  {scenario.revisions.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <select id={`${scenario.id}-revision`} className="rounded-lg border border-border bg-background px-3 py-2 text-xs">
                        {scenario.revisions.map((revision) => (
                          <option key={revision.id} value={revision.id}>
                            Revision #{revision.revisionNumber}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const select = document.getElementById(`${scenario.id}-revision`) as HTMLSelectElement | null;
                          if (select?.value) handleRollback(select.value);
                        }}
                        className="rounded-lg border border-border px-3 py-2 text-xs"
                      >
                        Rollback
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </article>
      ))}
    </section>
  );
}
