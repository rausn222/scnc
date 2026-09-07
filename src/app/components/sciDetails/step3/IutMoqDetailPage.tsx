import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Clock,
  Factory,
  GitCompareArrows,
  Layers,
  Link2Off,
  Search,
  Settings2,
  ShoppingCart,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import type { CBURow } from "../../data";
import { ProductionPlanModal } from "../../ProductionPlanModal";
import type { ComponentBreakdownRow, IUTOption, MOQPlantOption, PlantRole } from "../types";
import {
  C,
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  PLANT_BREAKDOWN_BASE,
  PM_BADGE,
  RM_BADGE,
  SCENARIOS,
} from "../constants";
import { computeAfterQtyAndDate, computeTransitionRows, formatIndianNumber, getActivePlantRoles } from "../utils";
import { ReportBadge } from "../step3report/ReportPrimitives";
import { TransposedComponentBreakdownTable, type TransposedBreakdownColumn } from "../step4/TransposedComponentBreakdownTable";

type SectionId = "summary" | "configure" | "iut-flow" | "procurement" | "breakdown" | "compare";

const NAV_GROUPS: { title: string; items: { id: SectionId; label: string }[] }[] = [
  { title: "Overview", items: [{ id: "summary", label: "Scenario Summary" }] },
  { title: "Configure", items: [{ id: "configure", label: "Select & Customise" }] },
  {
    title: "Transfer & Procurement",
    items: [
      { id: "iut-flow", label: "IUT Flow" },
      { id: "procurement", label: "Procurement Orders" },
    ],
  },
  { title: "Compare", items: [{ id: "compare", label: "Option Comparison" }] },
  { title: "Component Data", items: [{ id: "breakdown", label: "Component Breakdown" }] },
];

function materialBadge(material: string) {
  const [type, ...rest] = material.split(" ");
  const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
    </span>
  );
}

function laneBadge(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: C.green }}>
        <Check size={10} strokeWidth={2.5} />Available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#ea580c" }}>
        <Link2Off size={10} />Unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#d97706" }}>
      <Clock size={10} />Not set
    </span>
  );
}

function computeOutcome(
  plantCode: string,
  transfer: IUTOption | null,
  moqPlantList: MOQPlantOption[],
  moqSuppliers: Record<string, string>,
  scenarioId: string,
) {
  const base = PLANT_BREAKDOWN_BASE[plantCode];
  if (!base) return null;
  const moqPlant = moqPlantList.find((p) => p.plant === plantCode) ?? null;
  const roles: PlantRole[] = [];
  if (transfer?.routeFrom === plantCode) roles.push("source");
  if (transfer?.routeTo === plantCode) roles.push("destination");
  if (moqPlant) roles.push("ordering");
  const { qty, date } = computeAfterQtyAndDate(
    plantCode,
    roles,
    scenarioId,
    transfer,
    moqPlant,
    moqSuppliers,
    base.totalProductionPlanQty,
    base.prodStopDate,
  );
  return { plantCode, finalFgProducible: qty, productionStopDate: date, planChangeRequired: date !== base.prodStopDate };
}

/** Sticky, scroll-spied anchor rail — jumps the right-hand pane to any section without losing place in the popup. */
function AnchorNav({ activeId, onNavigate }: { activeId: SectionId; onNavigate: (id: SectionId) => void }) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const toggleGroup = (title: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  return (
    <nav
      className="sticky top-0 shrink-0 flex flex-col gap-3 py-4 px-3 max-h-screen overflow-y-auto"
      style={{ width: 208, borderRight: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
    >
      {NAV_GROUPS.map((group) => {
        const isOpen = !collapsedGroups.has(group.title);
        return (
          <div key={group.title}>
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors hover:bg-slate-100"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                {group.title}
              </span>
              <ChevronDown
                size={11}
                style={{ color: "#94a3b8", transform: isOpen ? undefined : "rotate(-90deg)", transition: "transform 0.15s" }}
              />
            </button>
            {isOpen && (
              <div className="mt-0.5 flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className="text-left px-2.5 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
                      style={{
                        color: active ? C.blue : "#475569",
                        backgroundColor: active ? C.bgBlue : "transparent",
                        borderLeft: active ? `3px solid ${C.blue}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function SectionShell({
  id,
  icon,
  title,
  subtitle,
  registerRef,
  action,
  children,
}: {
  id: SectionId;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  registerRef: (id: SectionId, el: HTMLElement | null) => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section ref={(el) => registerRef(id, el)} data-section-id={id} className="scroll-mt-3">
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap"
          style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#fff", color: C.blue, border: "1px solid #e2e8f0" }}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: C.blue }}>{title}</p>
              {subtitle && (
                <p className="text-[10px] truncate" style={{ color: "#64748b" }}>{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </section>
  );
}

export function IutMoqDetailPage({
  row,
  scenarioId = "iut-moq",
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  row: CBURow;
  scenarioId?: "iut-moq" | "iut-moq-break";
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS.find((s) => s.id === "iut-moq")!;
  const transferOptions = IUT_TRANSFER_OPTIONS.slice(0, scenarioId === "iut-moq" ? 3 : 2);
  const moqPlantData = scenarioId === "iut-moq-break" ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;

  const [customising, setCustomising] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [optionOverrides, setOptionOverrides] = useState<
    Record<string, Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>>
  >({});
  const [moqOrderQtyOverrides, setMoqOrderQtyOverrides] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("");
  const [productionPlanPlant, setProductionPlanPlant] = useState<string | null>(null);

  const handleSelTransfer = (id: string) => {
    if (id !== selTransfer) setHasChanges(true);
    onSelTransfer(id);
  };
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    if (moqSuppliers[plantId] !== supplierId) setHasChanges(true);
    onMoqSupplier(plantId, supplierId);
  };
  const updateOptionOverride = (
    id: string,
    patch: Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>,
  ) => {
    setOptionOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setHasChanges(true);
  };
  const updateMoqOrderQty = (plantId: string, orderQty: number) => {
    setMoqOrderQtyOverrides((prev) => ({ ...prev, [plantId]: orderQty }));
    setHasChanges(true);
  };

  const selectedTransfer = transferOptions.find((o) => o.id === selTransfer) ?? transferOptions[0] ?? null;
  const effSelectedTransfer: IUTOption | null = selectedTransfer
    ? { ...selectedTransfer, ...optionOverrides[selectedTransfer.id] }
    : null;
  const effMoqPlantData = useMemo(
    () => moqPlantData.map((p) => ({ ...p, orderQty: moqOrderQtyOverrides[p.id] ?? p.orderQty })),
    [moqPlantData, moqOrderQtyOverrides],
  );

  const evaluate = (transfer: IUTOption | null, moqList: MOQPlantOption[]) => {
    const outcomes = Object.keys(PLANT_BREAKDOWN_BASE)
      .map((code) => computeOutcome(code, transfer, moqList, moqSuppliers, scenarioId))
      .filter((o): o is NonNullable<typeof o> => o !== null);
    const totalFg = outcomes.reduce((sum, o) => sum + o.finalFgProducible, 0);
    const procurementCost = moqList.reduce((sum, plant) => {
      const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
      return sum + plant.orderQty * supplier.pricePerUnit;
    }, 0);
    const totalCost = (transfer?.costPerTrip ?? 0) + procurementCost;
    return { outcomes, totalFg, totalCost, procurementCost };
  };

  const selectedEval = useMemo(
    () => evaluate(effSelectedTransfer, effMoqPlantData),
    [effSelectedTransfer, effMoqPlantData, moqSuppliers, scenarioId],
  );

  // Comparison table uses each route's own definition (not the selected route's edits) so the
  // three options stay apples-to-apples; procurement is shared network state, so it still reflects overrides.
  const compareEvals = useMemo(
    () => transferOptions.map((option) => ({ option, ...evaluate(option, effMoqPlantData) })),
    [transferOptions, effMoqPlantData, moqSuppliers, scenarioId],
  );

  // ── Component breakdown table wiring (mirrors ScenarioDetailView) ──
  const selectedMoqForBreakdown = moqPlantData.find((p) => p.isBest) ?? moqPlantData[0] ?? null;
  const activePlantRoles = useMemo(
    () => getActivePlantRoles(scenarioId, effSelectedTransfer, selectedMoqForBreakdown),
    [scenarioId, effSelectedTransfer, selectedMoqForBreakdown],
  );
  const plantBlocks = useMemo(
    () =>
      activePlantRoles.map(({ code, roles }) => ({
        code,
        roles,
        rowsByState: computeTransitionRows(code, roles, scenarioId, effSelectedTransfer, selectedMoqForBreakdown, moqSuppliers),
      })),
    [activePlantRoles, scenarioId, effSelectedTransfer, selectedMoqForBreakdown, moqSuppliers],
  );
  const hasMeaningfulData = (r: ComponentBreakdownRow) =>
    r.onHandStock !== "—" || r.openPoQty !== "—" || r.fgEquivalentStock !== "—";
  const filterComponents = (rows: ComponentBreakdownRow[], plantCode: string) => {
    const withData = rows.filter(hasMeaningfulData);
    const q = filter.trim().toLowerCase();
    if (!q) return withData;
    return withData.filter(
      (r) => r.component.toLowerCase().includes(q) || plantCode.toLowerCase().includes(q) || r.type.toLowerCase().includes(q),
    );
  };
  const transposedColumns = useMemo(() => {
    const cols: TransposedBreakdownColumn[] = [];
    for (const block of plantBlocks) {
      const beforeRows = filterComponents(block.rowsByState.before, block.code);
      if (beforeRows.length === 0) continue;
      const matched = new Set(beforeRows.map((r) => r.component));
      const afterByComponent = new Map(
        block.rowsByState.after.filter((r) => matched.has(r.component)).map((r) => [r.component, r]),
      );
      const plantMeta = PLANT_BREAKDOWN_BASE[block.code];
      for (const before of beforeRows) {
        cols.push({
          key: `${block.code}-${before.component}`,
          plantCode: block.code,
          roles: block.roles,
          before,
          after: afterByComponent.get(before.component) ?? null,
          plantMeta,
        });
      }
    }
    return cols;
  }, [plantBlocks, filter]);

  // ── Anchor nav + scrollspy ──
  // The Modal's own body (not this component) owns the scroll, so the nav sticks via
  // `position: sticky` and the observer watches the browser viewport — which correctly
  // accounts for the Modal's overflow clipping per the IntersectionObserver spec.
  const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const [activeSection, setActiveSection] = useState<SectionId>("summary");
  const registerRef = (id: SectionId, el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };
  const navigateToSection = (id: SectionId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.sectionId as SectionId | undefined;
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: "-8% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-start">
      {productionPlanPlant && (
        <ProductionPlanModal
          plantCode={productionPlanPlant}
          cbuCode={row.cbuCode}
          cbuDescription={row.cbuDescription}
          totalProduction={PLANT_BREAKDOWN_BASE[productionPlanPlant]?.totalProductionPlanQty ?? 0}
          onClose={() => setProductionPlanPlant(null)}
        />
      )}

      <AnchorNav activeId={activeSection} onNavigate={navigateToSection} />

      <div className="flex-1 min-w-0">
        {/* Stat pill strip */}
        <div className="px-5 pt-4 flex flex-wrap items-center gap-2">
          {[
            { label: "Business Waste", value: scenario.businessWaste ?? "—", tone: { bg: "#fef2f2", color: "#b91c1c" } },
            ...(scenario.wasteSavings
              ? [{ label: "Savings vs No Action", value: `↓ ${scenario.wasteSavings}`, tone: { bg: "#f0fdf4", color: "#166534" } }]
              : []),
            { label: "FG Days Cover", value: scenario.fgDaysCover ?? "—", tone: { bg: C.bgBlue, color: C.blue } },
            { label: "Total Cost (selected)", value: `₹${formatIndianNumber(selectedEval.totalCost)}`, tone: { bg: "#fff7ed", color: "#c2410c" } },
            { label: "Total FG (selected)", value: formatIndianNumber(selectedEval.totalFg), tone: { bg: "#f5f3ff", color: "#6d28d9" } },
          ].map((pill) => (
            <div key={pill.label} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: pill.tone.bg }}>
              <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: pill.tone.color, opacity: 0.85 }}>
                {pill.label}
              </div>
              <div className="text-xs font-bold tabular-nums" style={{ color: pill.tone.color }}>{pill.value}</div>
            </div>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* ── Scenario Summary ── */}
          <SectionShell id="summary" icon={<Factory size={13} />} title="Scenario Summary" subtitle={`Based on ${selectedTransfer?.label ?? "the selected route"}`} registerRef={registerRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedEval.outcomes.map((o) => (
                <div key={o.plantCode} className="rounded-lg px-3 py-2.5 flex flex-col gap-1.5" style={{ backgroundColor: "#fafafa", border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: C.navy }}>{o.plantCode}</span>
                    {o.planChangeRequired ? (
                      <ReportBadge tone="warning">Plan change needed</ReportBadge>
                    ) : (
                      <ReportBadge tone="success">No plan change</ReportBadge>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: "#374151" }}>
                    FG Producible <b className="tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(o.finalFgProducible)}</b>
                  </div>
                  <div className="text-[11px]" style={{ color: "#374151" }}>
                    Stop Date <b>{o.productionStopDate}</b>
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>

          {/* ── Select & Customise ── */}
          <SectionShell
            id="configure"
            icon={<SlidersHorizontal size={13} />}
            title="Select & Customise"
            subtitle="Choose the IUT route and toggle edit mode for its inputs"
            registerRef={registerRef}
            action={
              <button
                type="button"
                onClick={() => setCustomising((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                style={
                  customising
                    ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                    : { backgroundColor: "#fff", color: C.navy, border: "1px solid #cbd5e1" }
                }
              >
                <Settings2 size={11} />
                {customising ? "Done customising" : "Customise inputs"}
              </button>
            }
          >
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 max-w-md">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>IUT Route</span>
                <select
                  value={selTransfer}
                  onChange={(e) => handleSelTransfer(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none"
                  style={{ border: `1px solid ${C.borderBlue}`, color: C.navy, backgroundColor: "#fff" }}
                >
                  {transferOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} · {o.routeFrom} → {o.routeTo}{o.isBest ? " (Recommended)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              {selectedTransfer && (
                <div className="flex flex-wrap items-center gap-4 rounded-lg px-3 py-2.5" style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}` }}>
                  <span className="text-[11px] font-semibold" style={{ color: C.navy }}>
                    {selectedTransfer.routeFrom} <ArrowLeftRight size={11} className="inline mx-1" style={{ color: C.blue }} /> {selectedTransfer.routeTo}
                  </span>
                  <span className="text-[11px]" style={{ color: "#374151" }}>Lead time <b>{selectedTransfer.transferLeadTime}</b></span>
                  <span className="text-[11px]" style={{ color: "#374151" }}>Cost/trip <b>₹{selectedTransfer.costPerTrip}</b></span>
                  {laneBadge(selectedTransfer.laneAvailable)}
                  {selectedTransfer.isBest && (
                    <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>
                  )}
                </div>
              )}

              <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                Supplier and detailed transfer inputs are editable per section below once customisation is on.
              </p>
            </div>
          </SectionShell>

          {/* ── IUT Flow ── */}
          <SectionShell id="iut-flow" icon={<ArrowLeftRight size={13} />} title="IUT Flow" subtitle={selectedTransfer ? `${selectedTransfer.routeFrom} → ${selectedTransfer.routeTo}` : undefined} registerRef={registerRef}>
            {selectedTransfer && effSelectedTransfer ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">{materialBadge(selectedTransfer.material)}</div>
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="text-center">
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>From</div>
                    <div className="text-sm font-bold" style={{ color: C.navy }}>{selectedTransfer.routeFrom}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 min-w-[120px]">
                    {customising ? (
                      <input
                        type="number"
                        min={0}
                        value={effSelectedTransfer.transferQty}
                        onChange={(e) => updateOptionOverride(selectedTransfer.id, { transferQty: Number(e.target.value) || 0 })}
                        className="w-full text-center text-xs font-semibold tabular-nums rounded px-1.5 py-1"
                        style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                      />
                    ) : (
                      <span className="text-xs font-semibold tabular-nums whitespace-nowrap" style={{ color: C.blue }}>
                        {effSelectedTransfer.transferQty.toLocaleString("en-IN")} EA
                      </span>
                    )}
                    <ArrowLeftRight size={16} style={{ color: C.blue }} />
                    {customising ? (
                      <input
                        type="text"
                        value={effSelectedTransfer.transferLeadTime}
                        onChange={(e) => updateOptionOverride(selectedTransfer.id, { transferLeadTime: e.target.value })}
                        className="w-full text-center text-[10px] rounded px-1.5 py-1"
                        style={{ border: `1px solid ${C.blue}`, color: "#374151", outline: "none" }}
                      />
                    ) : (
                      <span className="text-[10px] whitespace-nowrap" style={{ color: "#94a3b8" }}>{effSelectedTransfer.transferLeadTime} lead</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>To</div>
                    <div className="text-sm font-bold" style={{ color: C.navy }}>{selectedTransfer.routeTo}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Initiation</div>
                    {customising ? (
                      <input
                        type="text"
                        value={effSelectedTransfer.initiationDate}
                        onChange={(e) => updateOptionOverride(selectedTransfer.id, { initiationDate: e.target.value })}
                        className="w-full text-center text-[11px] font-semibold rounded px-1"
                        style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                      />
                    ) : (
                      <div className="text-[11px] font-semibold" style={{ color: C.navy }}>{effSelectedTransfer.initiationDate}</div>
                    )}
                  </div>
                  <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Lane</div>
                    <div className="mt-0.5">{laneBadge(selectedTransfer.laneAvailable)}</div>
                  </div>
                  <div className="rounded-lg px-2.5 py-2 text-center" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Cost/Trip</div>
                    {customising ? (
                      <input
                        type="number"
                        min={0}
                        value={effSelectedTransfer.costPerTrip}
                        onChange={(e) => updateOptionOverride(selectedTransfer.id, { costPerTrip: Number(e.target.value) || 0 })}
                        className="w-full text-center text-[11px] font-semibold rounded px-1"
                        style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                      />
                    ) : (
                      <div className="text-[11px] font-semibold" style={{ color: C.navy }}>₹{effSelectedTransfer.costPerTrip}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#94a3b8" }}>No route selected.</p>
            )}
          </SectionShell>

          {/* ── Procurement Orders ── */}
          <SectionShell id="procurement" icon={<ShoppingCart size={13} />} title="Procurement Orders" subtitle={`${effMoqPlantData.length} orders across plants`} registerRef={registerRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {effMoqPlantData.map((plant) => {
                const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                return (
                  <div key={plant.id} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "#fafafa", border: "1px solid #f1f5f9" }}>
                    <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                      {materialBadge(plant.material)}
                    </div>
                    <div className="mb-2">
                      {customising ? (
                        <select
                          value={supplier.id}
                          onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                          className="text-[11px] rounded px-2 py-1 cursor-pointer"
                          style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                        >
                          {plant.suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] font-semibold" style={{ color: C.blue }}>{supplier.name}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]" style={{ color: "#374151" }}>
                      {customising ? (
                        <span className="flex items-center gap-1.5">
                          <span>Order Qty</span>
                          <input
                            type="number"
                            min={0}
                            value={plant.orderQty}
                            onChange={(e) => updateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                            className="w-20 text-center tabular-nums rounded px-1 py-0.5"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                          />
                        </span>
                      ) : (
                        <span>Order Qty <b className="tabular-nums">{formatIndianNumber(plant.orderQty)}</b></span>
                      )}
                      <span>MOQ <b className="tabular-nums">{formatIndianNumber(supplier.moq)}</b></span>
                      <span>Price/Unit <b className="tabular-nums">₹{supplier.pricePerUnit}</b></span>
                      <span>Est. Total <b className="tabular-nums">₹{formatIndianNumber(plant.orderQty * supplier.pricePerUnit)}</b></span>
                    </div>
                    <div className="mt-2 text-[10px]" style={{ color: "#94a3b8" }}>Production: {supplier.productionDate}</div>
                  </div>
                );
              })}
            </div>
          </SectionShell>

          {/* ── Option Comparison ── */}
          <SectionShell id="compare" icon={<GitCompareArrows size={13} />} title="Option Comparison" subtitle="Every IUT route side by side, using the current procurement plan" registerRef={registerRef}>
            <div className="overflow-x-auto">
              <table className="border-collapse w-full" style={{ minWidth: "max-content" }}>
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#94a3b8", backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0", minWidth: 130 }}
                    >
                      Metric
                    </th>
                    {compareEvals.map(({ option }, i) => {
                      const isSelected = selTransfer === option.id;
                      return (
                        <th
                          key={option.id}
                          className="px-3 py-2 text-center"
                          style={{ backgroundColor: isSelected ? C.bgBlue : "#f8fafc", borderBottom: `2px solid ${isSelected ? C.blue : "#e2e8f0"}`, minWidth: 170 }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold" style={{ color: C.navy }}>Option {i + 1}</span>
                              {option.isBest && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                  <Star size={7} fill="currentColor" />Best
                                </span>
                              )}
                            </div>
                            <span className="text-[10px]" style={{ color: "#64748b" }}>{option.routeFrom} → {option.routeTo}</span>
                            <button
                              type="button"
                              disabled={isSelected}
                              onClick={() => handleSelTransfer(option.id)}
                              className="mt-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-opacity"
                              style={{
                                backgroundColor: isSelected ? "#dcfce7" : C.blue,
                                color: isSelected ? "#166534" : "#fff",
                                cursor: isSelected ? "default" : "pointer",
                              }}
                            >
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1"><Check size={10} strokeWidth={3} />Selected</span>
                              ) : (
                                "Select"
                              )}
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: "Material", render: (o: IUTOption) => materialBadge(o.material) },
                      { label: "Transfer Qty", render: (o: IUTOption) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{o.transferQty.toLocaleString("en-IN")} EA</span> },
                      { label: "Lead Time", render: (o: IUTOption) => <span className="text-xs" style={{ color: "#374151" }}>{o.transferLeadTime}</span> },
                      { label: "Lane Availability", render: (o: IUTOption) => laneBadge(o.laneAvailable) },
                      { label: "Cost / Trip", render: (o: IUTOption) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{o.costPerTrip}</span> },
                      { label: "Total Cost", render: (_o: IUTOption, ev: ReturnType<typeof evaluate>) => <span className="text-xs font-bold tabular-nums" style={{ color: "#c2410c" }}>₹{formatIndianNumber(ev.totalCost)}</span> },
                      { label: "Total FG Producible", render: (_o: IUTOption, ev: ReturnType<typeof evaluate>) => <span className="text-xs font-bold tabular-nums" style={{ color: "#166534" }}>{formatIndianNumber(ev.totalFg)}</span> },
                      { label: "Reduction vs No Action", render: (o: IUTOption) => <span className="text-xs font-semibold tabular-nums" style={{ color: C.teal }}>↓ ₹{o.reductionVsNoAction.toLocaleString("en-IN")}</span> },
                      { label: "Initiation Date", render: (o: IUTOption) => <span className="text-xs font-semibold" style={{ color: C.navy }}>{o.initiationDate}</span> },
                    ] as { label: string; render: (o: IUTOption, ev: ReturnType<typeof evaluate>) => React.ReactNode }[]
                  ).map((metricRow) => (
                    <tr key={metricRow.label} style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td className="px-3 py-2 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                        {metricRow.label}
                      </td>
                      {compareEvals.map((ev) => (
                        <td key={ev.option.id} className="px-3 py-2 text-center">
                          {metricRow.render(ev.option, ev)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionShell>

          {/* ── Component Breakdown ── */}
          <SectionShell
            id="breakdown"
            icon={<Layers size={13} />}
            title="Component Breakdown by Plant"
            subtitle={`Metrics × components · ${row.cbuCode}`}
            registerRef={registerRef}
            action={
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter plant or component"
                  className="pl-6 pr-2 py-1 rounded-md text-[10px] focus:outline-none"
                  style={{ border: "1px solid #d1d5db", minWidth: 180, color: "#111827" }}
                />
              </div>
            }
          >
            <div className="-m-4 mt-0">
              <TransposedComponentBreakdownTable columns={transposedColumns} onOpenProductionPlan={setProductionPlanPlant} />
            </div>
          </SectionShell>
        </div>

        {hasChanges && (
          <div
            className="sticky bottom-0 px-5 py-3 flex items-center justify-between gap-3"
            style={{ borderTop: "2px solid #bfdbfe", backgroundColor: "#eff6ff" }}
          >
            <p className="text-xs" style={{ color: C.blue }}>
              <span className="font-semibold">Unsaved changes</span>
              {" — "}review your selection before applying.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHasChanges(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasChanges(false);
                  toast.success("Changes applied", { description: "Scenario updated with your selection.", duration: 3000 });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: C.blue, color: "#fff" }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
