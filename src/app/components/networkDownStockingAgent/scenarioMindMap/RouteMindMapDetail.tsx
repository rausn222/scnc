import type React from "react";
import { Fragment, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Factory,
  GitCompareArrows,
  Link2Off,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Star,
  Workflow,
} from "lucide-react";
import {
  FOCUS_VIEW_OPTIONS,
  FOCUS_VIEW_IUT_MATERIALS,
  FOCUS_VIEW_PROCUREMENT,
  IUT_TRANSFER_SLA_DAYS,
  summarizeIutMaterials,
  summarizeProcurement,
  tagComparisonValues,
  type ComparisonTag,
  type FocusViewOption,
  type IutTransferMaterialLine,
} from "../../../constants/networkDownStockingAgent";
import { C, RM_BADGE, PM_BADGE } from "../../sciDetails/constants";
import { formatIndianNumber } from "../../sciDetails/utils";
import { ReportBadge, ReportSectionHeading } from "../../sciDetails/step3report/ReportPrimitives";

function materialBadge(type: "RM" | "PM", code: string) {
  const badge = type === "RM" ? RM_BADGE : PM_BADGE;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="text-[10px] font-bold" style={{ color: C.navy }}>{code}</span>
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

/** One box in the Procure → Transfer → Produce pipeline. */
function PipelineStage({
  icon,
  tint,
  accent,
  label,
  primary,
  secondary,
  flag,
  isOpen,
  onToggle,
  toggleLabel,
  toggleLocked,
}: {
  icon: React.ReactNode;
  tint: string;
  accent: string;
  label: string;
  primary: string;
  secondary: string;
  flag?: string;
  isOpen: boolean;
  onToggle: () => void;
  toggleLabel: string;
  /** True while Customise forces this stage open — the user can't collapse it mid-edit. */
  toggleLocked?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[230px] rounded-lg overflow-hidden bg-white" style={{ border: `1px solid ${isOpen ? accent : "#e2e8f0"}` }}>
      <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: tint }}>
        <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "#fff", color: accent, border: "1px solid #e2e8f0" }}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>{label}</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-1.5">
        <div className="text-base font-bold" style={{ color: C.navy }}>{primary}</div>
        <div className="text-[11px] leading-relaxed" style={{ color: "#64748b" }}>{secondary}</div>
        {flag && (
          <div className="mt-0.5">
            <ReportBadge tone="warning">{flag}</ReportBadge>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          disabled={toggleLocked}
          title={toggleLocked ? "Open while customising" : undefined}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold w-fit"
          style={{ color: accent, cursor: toggleLocked ? "default" : "pointer", opacity: toggleLocked ? 0.6 : 1 }}
        >
          {isOpen ? "Hide" : "View"} {toggleLabel}
          <ChevronDown size={11} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
      </div>
    </div>
  );
}

function ArrowConnector() {
  return (
    <div className="flex items-center justify-center shrink-0 self-center px-1" style={{ width: 28 }}>
      <ArrowRight size={18} style={{ color: "#cbd5e1" }} />
    </div>
  );
}

/** Colored band row that opens a section (Outcome / Procure / Transfer) inside the Compare table. */
function CompareSectionRow({ icon, label, accent, colSpan }: { icon: React.ReactNode; label: string; accent: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-2" style={{ backgroundColor: accent }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(255,255,255,0.75)" }}>{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</span>
        </div>
      </td>
    </tr>
  );
}

/** One metric row in the Compare table — a label cell plus one value cell per option, tinted when tagged best/high. */
function CompareMetricRow({ label, cells }: { label: React.ReactNode; cells: { key: string; content: React.ReactNode; tag?: ComparisonTag }[] }) {
  return (
    <tr style={{ borderTop: "1px solid #f1f5f9" }}>
      <td className="px-4 py-3 text-[12px]" style={{ color: "#475569", borderRight: "1px solid #e2e8f0" }}>{label}</td>
      {cells.map((cell) => (
        <td
          key={cell.key}
          className="px-4 py-3 text-center"
          style={{ backgroundColor: cell.tag === "best" ? "#f0fdf4" : cell.tag === "high" ? "#fef2f2" : "transparent" }}
        >
          <div className="text-[13px] font-bold tabular-nums" style={{ color: cell.tag === "best" ? "#166534" : cell.tag === "high" ? "#dc2626" : C.navy }}>
            {cell.content}
          </div>
        </td>
      ))}
    </tr>
  );
}

type MaterialOverride = Partial<Pick<IutTransferMaterialLine, "transferQty" | "leadTimeDays" | "initiationDate" | "costPerTrip">>;

/**
 * Content for the "Route Mind Map" row's More Details popup. Each routing
 * option is told as a Procure → Transfer → Produce pipeline — the headline
 * numbers at a glance, with the full itemised breakdown one tap away per
 * stage — rather than three parallel data tables. Selecting and customising
 * an option here is local to this popup — it doesn't feed back into the
 * outer scenario comparison, since this row is a read-only exploration, not
 * a scenario choice.
 */
export function RouteMindMapDetail() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");
  const [activeOptionId, setActiveOptionId] = useState<FocusViewOption["id"]>(
    () => FOCUS_VIEW_OPTIONS.find((o) => o.isBest)?.id ?? FOCUS_VIEW_OPTIONS[0].id,
  );
  const [selectedOptionId, setSelectedOptionId] = useState<FocusViewOption["id"]>(activeOptionId);
  const [customisingId, setCustomisingId] = useState<FocusViewOption["id"] | null>(null);
  const [materialOverrides, setMaterialOverrides] = useState<Record<FocusViewOption["id"], MaterialOverride>>({});
  const [procurementQtyOverrides, setProcurementQtyOverrides] = useState<Record<string, number>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const updateMaterial = (id: FocusViewOption["id"], patch: MaterialOverride) => {
    setMaterialOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };
  const updateProcurementQty = (key: string, orderQty: number) => {
    setProcurementQtyOverrides((prev) => ({ ...prev, [key]: orderQty }));
  };
  const toggleStage = (key: string) => {
    setExpandedStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeOption = FOCUS_VIEW_OPTIONS.find((o) => o.id === activeOptionId) ?? FOCUS_VIEW_OPTIONS[0];
  const activeIdx = FOCUS_VIEW_OPTIONS.findIndex((o) => o.id === activeOption.id);

  const renderOptionCard = (option: FocusViewOption, idx: number) => {
    const isSelected = selectedOptionId === option.id;
    const isCustomising = customisingId === option.id;

    const materials = FOCUS_VIEW_IUT_MATERIALS[option.id];
    const primaryMaterial = materials.reduce((max, m) => (m.transferQty > max.transferQty ? m : max), materials[0]);
    const effMaterial: IutTransferMaterialLine = { ...primaryMaterial, ...materialOverrides[option.id] };
    const displayMaterials = materials.map((m) => (m.code === primaryMaterial.code ? effMaterial : m));
    const iutSummary = summarizeIutMaterials(displayMaterials);

    const procurement = FOCUS_VIEW_PROCUREMENT[option.id].map((line) => ({
      ...line,
      orderQty: procurementQtyOverrides[`${option.id}:${line.code}`] ?? line.orderQty,
    }));
    const procurementSummary = summarizeProcurement(procurement);

    const totalFg = option.plants[0].finalFgProducible + option.plants[1].finalFgProducible;
    const planChangeCount = option.plants.filter((p) => p.planChangeRequired).length;

    const procurementKey = `${option.id}:procurement`;
    const transferKey = `${option.id}:transfer`;
    const produceKey = `${option.id}:produce`;
    const procurementOpen = isCustomising || !!expandedStages[procurementKey];
    const transferOpen = isCustomising || !!expandedStages[transferKey];
    const produceOpen = !!expandedStages[produceKey];

    return (
      <div
        key={option.id}
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: isSelected ? `2px solid ${C.blue}` : "1px solid #e2e8f0",
          boxShadow: isSelected ? "0 2px 10px rgba(21,101,192,0.12)" : "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        {/* Option header — route summary + Customise / Select */}
        <div
          className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
          style={{ backgroundColor: isSelected ? C.bgBlue : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-xs font-bold" style={{ color: C.navy }}>Option {idx + 1}</span>
            {option.isBest && (
              <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>
            )}
            <span className="text-[11px]" style={{ color: "#475569" }}>
              {option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCustomisingId((id) => (id === option.id ? null : option.id))}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors hover:bg-slate-50"
              style={
                isCustomising
                  ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                  : { backgroundColor: "#fff", color: C.navy, border: "1px solid #cbd5e1" }
              }
            >
              {isCustomising ? "Done" : "Customise"}
            </button>
            <button
              type="button"
              disabled={isSelected}
              onClick={() => setSelectedOptionId(option.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity"
              style={{
                backgroundColor: isSelected ? "#dcfce7" : C.blue,
                color: isSelected ? "#166534" : "#fff",
                cursor: isSelected ? "default" : "pointer",
              }}
            >
              {isSelected ? (
                <span className="inline-flex items-center gap-1">
                  <Check size={11} strokeWidth={2.5} />Selected
                </span>
              ) : (
                "Select"
              )}
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Hero numbers */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px] rounded-lg px-4 py-3" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#c2410c" }}>Total Cost</div>
              <div className="text-xl font-bold tabular-nums" style={{ color: "#c2410c" }}>₹{formatIndianNumber(option.totalCost)}</div>
            </div>
            <div className="flex-1 min-w-[180px] rounded-lg px-4 py-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#166534" }}>Total FG Gained</div>
              <div className="text-xl font-bold tabular-nums" style={{ color: "#166534" }}>{formatIndianNumber(totalFg)}</div>
            </div>
          </div>

          {/* Procure → Transfer → Produce pipeline */}
          <div className="flex items-stretch gap-3 flex-wrap lg:flex-nowrap">
            <PipelineStage
              icon={<ShoppingCart size={12} />}
              tint="#fdf4ff"
              accent="#7c3aed"
              label="Procure"
              primary={`${procurementSummary.orderCount} order${procurementSummary.orderCount === 1 ? "" : "s"}`}
              secondary={`${procurementSummary.supplierCount} supplier${procurementSummary.supplierCount === 1 ? "" : "s"} · ₹${formatIndianNumber(procurementSummary.totalValue)}`}
              flag={procurementSummary.attentionCount > 0 ? `${procurementSummary.attentionCount} order${procurementSummary.attentionCount === 1 ? "" : "s"} below MOQ` : undefined}
              isOpen={procurementOpen}
              onToggle={() => toggleStage(procurementKey)}
              toggleLabel="orders"
              toggleLocked={isCustomising}
            />
            <ArrowConnector />
            <PipelineStage
              icon={<ArrowLeftRight size={12} />}
              tint="#f0fdfa"
              accent="#0f766e"
              label="Transfer (IUT)"
              primary={`${option.routeFrom} → ${option.routeTo}`}
              secondary={`${iutSummary.materialCount} materials · ${formatIndianNumber(iutSummary.totalQty)} EA · max ${iutSummary.maxLeadTimeDays}d lead`}
              flag={iutSummary.slaBreachCount > 0 ? `${iutSummary.slaBreachCount} breach SLA` : undefined}
              isOpen={transferOpen}
              onToggle={() => toggleStage(transferKey)}
              toggleLabel="materials"
              toggleLocked={isCustomising}
            />
            <ArrowConnector />
            <PipelineStage
              icon={<Factory size={12} />}
              tint="#fff7ed"
              accent="#c2410c"
              label="Produce"
              primary={`${formatIndianNumber(totalFg)} FG total`}
              secondary={option.plants.map((p) => `${p.code}: ${formatIndianNumber(p.finalFgProducible)}`).join(" · ")}
              flag={planChangeCount > 0 ? `${planChangeCount} of ${option.plants.length} plants need a plan change` : undefined}
              isOpen={produceOpen}
              onToggle={() => toggleStage(produceKey)}
              toggleLabel="plants"
            />
          </div>

          {/* Procurement detail */}
          {procurementOpen && (
            <div className="rounded-lg overflow-hidden" style={{ border: isCustomising ? "1px solid #7c3aed" : "1px solid #e2e8f0" }}>
              <ReportSectionHeading icon={<ShoppingCart size={11} />} title="Procurement Orders" subtitle={`${procurement.length} orders · ₹${formatIndianNumber(procurementSummary.totalValue)}`} tint="#fdf4ff" />
              <div className="p-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                {procurement.map((line) => {
                  const key = `${option.id}:${line.code}`;
                  return (
                    <div key={line.code} className="rounded-lg px-3.5 py-3" style={{ backgroundColor: "#fafafa", border: "1px solid #f1f5f9" }}>
                      <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-bold" style={{ color: C.navy }}>{line.plant}</span>
                        {materialBadge(line.type, line.code)}
                      </div>
                      <div className="mb-2">
                        <span className="text-[10px] font-semibold" style={{ color: C.blue }}>{line.supplier}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] items-center" style={{ color: "#374151" }}>
                        {isCustomising ? (
                          <span className="flex items-center gap-1">
                            <span>Order Qty</span>
                            <input
                              type="number"
                              min={0}
                              value={line.orderQty}
                              onChange={(e) => updateProcurementQty(key, Number(e.target.value) || 0)}
                              className="w-20 text-center tabular-nums rounded px-1 py-0.5"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                            />
                          </span>
                        ) : (
                          <span>Order Qty <b className="tabular-nums">{formatIndianNumber(line.orderQty)}</b></span>
                        )}
                        <span>MOQ <b className="tabular-nums">{formatIndianNumber(line.moq)}</b></span>
                        <span>Price/Unit <b className="tabular-nums">₹{line.pricePerUnit}</b></span>
                        <span>Est. Total <b className="tabular-nums">₹{formatIndianNumber(line.orderQty * line.pricePerUnit)}</b></span>
                      </div>
                      <div className="mt-2 text-[9px]" style={{ color: "#94a3b8" }}>Production: {line.productionDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transfer detail */}
          {transferOpen && (
            <div className="rounded-lg overflow-hidden" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0" }}>
              <ReportSectionHeading icon={<ArrowLeftRight size={11} />} title="IUT Transfer Materials" subtitle={`${iutSummary.materialCount} materials · max ${iutSummary.maxLeadTimeDays}d lead time`} tint="#f0fdfa" />
              <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>From</div>
                    <div className="text-xs font-bold" style={{ color: C.navy }}>{option.routeFrom}</div>
                  </div>
                  <ArrowRight size={13} style={{ color: "#0f766e" }} />
                  <div className="text-center">
                    <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>To</div>
                    <div className="text-xs font-bold" style={{ color: C.navy }}>{option.routeTo}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#94a3b8" }}>
                  Lane {laneBadge(option.laneAvailable)}
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <div
                  className="grid gap-x-4 gap-y-3 items-center text-[10px]"
                  style={{ gridTemplateColumns: "auto minmax(120px,1fr) auto auto auto auto", color: "#374151" }}
                >
                  <span />
                  <span className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Material</span>
                  <span className="text-[9px] font-semibold uppercase text-right" style={{ color: "#94a3b8" }}>Qty</span>
                  <span className="text-[9px] font-semibold uppercase text-right" style={{ color: "#94a3b8" }}>Lead</span>
                  <span className="text-[9px] font-semibold uppercase text-right" style={{ color: "#94a3b8" }}>Initiation</span>
                  <span className="text-[9px] font-semibold uppercase text-right" style={{ color: "#94a3b8" }}>Cost/Trip</span>

                  {displayMaterials.map((m) => {
                    const isPrimary = m.code === primaryMaterial.code;
                    const breach = m.leadTimeDays > IUT_TRANSFER_SLA_DAYS;
                    return (
                      <Fragment key={m.code}>
                        {materialBadge(m.type, m.code)}
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{m.name}</span>
                          {breach && <ReportBadge tone="danger">SLA</ReportBadge>}
                        </span>
                        {isPrimary && isCustomising ? (
                          <input
                            type="number"
                            min={0}
                            value={effMaterial.transferQty}
                            onChange={(e) => updateMaterial(option.id, { transferQty: Number(e.target.value) || 0 })}
                            className="w-20 text-center tabular-nums rounded px-1 py-0.5 justify-self-end"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                          />
                        ) : (
                          <span className="text-right tabular-nums">{m.transferQty.toLocaleString("en-IN")} EA</span>
                        )}
                        {isPrimary && isCustomising ? (
                          <input
                            type="number"
                            min={0}
                            value={effMaterial.leadTimeDays}
                            onChange={(e) => updateMaterial(option.id, { leadTimeDays: Number(e.target.value) || 0 })}
                            className="w-12 text-center tabular-nums rounded px-1 py-0.5 justify-self-end"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                          />
                        ) : (
                          <span className="text-right tabular-nums">{m.leadTimeDays}d</span>
                        )}
                        {isPrimary && isCustomising ? (
                          <input
                            type="text"
                            value={effMaterial.initiationDate}
                            onChange={(e) => updateMaterial(option.id, { initiationDate: e.target.value })}
                            className="w-28 text-center rounded px-1 py-0.5 justify-self-end"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                          />
                        ) : (
                          <span className="text-right whitespace-nowrap">{m.initiationDate}</span>
                        )}
                        {isPrimary && isCustomising ? (
                          <span className="flex items-center gap-0.5 justify-self-end">
                            ₹
                            <input
                              type="number"
                              min={0}
                              value={effMaterial.costPerTrip}
                              onChange={(e) => updateMaterial(option.id, { costPerTrip: Number(e.target.value) || 0 })}
                              className="w-16 text-center rounded px-1 py-0.5"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                            />
                          </span>
                        ) : (
                          <span className="text-right whitespace-nowrap">₹{m.costPerTrip}</span>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Production outcome detail */}
          {produceOpen && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <ReportSectionHeading icon={<Factory size={11} />} title="Production Outcome" subtitle={`${option.plants.length} plants`} tint="#fff7ed" />
              <div className="p-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {option.plants.map((p) => (
                  <div key={p.code} className="rounded-lg px-3.5 py-3 flex flex-col gap-1" style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9" }}>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold" style={{ color: C.navy }}>{p.code}</span>
                      {p.planChangeRequired ? (
                        <ReportBadge tone="warning">Plan change needed</ReportBadge>
                      ) : (
                        <ReportBadge tone="success">No plan change</ReportBadge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="text-[11px]" style={{ color: "#374151" }}>
                        FG Producible <b className="tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(p.finalFgProducible)}</b>
                      </div>
                      <div className="text-[11px]" style={{ color: "#374151" }}>
                        Stop Date <b>{p.stopDate}</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCompareTable = () => {
    const rows = FOCUS_VIEW_OPTIONS.map((option) => {
      const iutSummary = summarizeIutMaterials(FOCUS_VIEW_IUT_MATERIALS[option.id]);
      const procurementSummary = summarizeProcurement(FOCUS_VIEW_PROCUREMENT[option.id]);
      const totalFg = option.plants[0].finalFgProducible + option.plants[1].finalFgProducible;
      const planChangeCount = option.plants.filter((p) => p.planChangeRequired).length;
      return { option, iutSummary, procurementSummary, totalFg, planChangeCount };
    });

    const totalCostTags = tagComparisonValues(rows.map((r) => r.option.totalCost), false);
    const totalFgTags = tagComparisonValues(rows.map((r) => r.totalFg), true);
    const planChangeTags = tagComparisonValues(rows.map((r) => r.planChangeCount), false);
    const orderValueTags = tagComparisonValues(rows.map((r) => r.procurementSummary.totalValue), false);
    const leadTimeTags = tagComparisonValues(rows.map((r) => r.iutSummary.maxLeadTimeDays), false);

    return (
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
        <table className="border-collapse w-full" style={{ minWidth: "max-content" }}>
          <thead>
            <tr>
              <th
                className="px-4 py-2.5 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                style={{ color: "#94a3b8", backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", borderRight: "1px solid #e2e8f0", minWidth: 150 }}
              >
                Metric
              </th>
              {rows.map(({ option }) => (
                <th
                  key={option.id}
                  className="px-4 py-3 text-center"
                  style={{ backgroundColor: option.id === selectedOptionId ? C.bgBlue : "#f8fafc", borderBottom: `2px solid ${option.id === selectedOptionId ? C.blue : "#e2e8f0"}`, minWidth: 200 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: C.navy }}>{option.label}</span>
                      {option.isBest && (
                        <ReportBadge tone="success"><Star size={8} fill="currentColor" />Best</ReportBadge>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: "#64748b" }}>{option.routeFrom} → {option.routeTo}</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setActiveOptionId(option.id); setViewMode("single"); }}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors hover:bg-slate-50"
                        style={{ backgroundColor: "#fff", color: C.navy, border: "1px solid #cbd5e1" }}
                      >
                        View pipeline
                      </button>
                      <button
                        type="button"
                        disabled={selectedOptionId === option.id}
                        onClick={() => setSelectedOptionId(option.id)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-opacity"
                        style={{
                          backgroundColor: selectedOptionId === option.id ? "#dcfce7" : C.blue,
                          color: selectedOptionId === option.id ? "#166534" : "#fff",
                          cursor: selectedOptionId === option.id ? "default" : "pointer",
                        }}
                      >
                        {selectedOptionId === option.id ? (
                          <span className="inline-flex items-center gap-1"><Check size={10} strokeWidth={3} />Selected</span>
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareSectionRow icon={<Factory size={11} />} label="Outcome" accent={C.navy} colSpan={rows.length + 1} />
            <CompareMetricRow
              label="Total Cost"
              cells={rows.map((r, i) => ({ key: r.option.id, content: `₹${formatIndianNumber(r.option.totalCost)}`, tag: totalCostTags[i] }))}
            />
            <CompareMetricRow
              label="Total FG Gained"
              cells={rows.map((r, i) => ({ key: r.option.id, content: formatIndianNumber(r.totalFg), tag: totalFgTags[i] }))}
            />
            <CompareMetricRow
              label="Plan Changes Needed"
              cells={rows.map((r, i) => ({ key: r.option.id, content: `${r.planChangeCount} of ${r.option.plants.length}`, tag: planChangeTags[i] }))}
            />

            <CompareSectionRow icon={<ShoppingCart size={11} />} label="Procure" accent="#7c3aed" colSpan={rows.length + 1} />
            <CompareMetricRow
              label="Orders"
              cells={rows.map((r) => ({
                key: r.option.id,
                content: (
                  <>
                    {r.procurementSummary.orderCount}
                    {r.procurementSummary.attentionCount > 0 && (
                      <span className="block text-[9px] font-semibold mt-0.5" style={{ color: "#b45309" }}>{r.procurementSummary.attentionCount} below MOQ</span>
                    )}
                  </>
                ),
              }))}
            />
            <CompareMetricRow
              label="Suppliers"
              cells={rows.map((r) => ({ key: r.option.id, content: r.procurementSummary.supplierCount }))}
            />
            <CompareMetricRow
              label="Order Value"
              cells={rows.map((r, i) => ({ key: r.option.id, content: `₹${formatIndianNumber(r.procurementSummary.totalValue)}`, tag: orderValueTags[i] }))}
            />

            <CompareSectionRow icon={<ArrowLeftRight size={11} />} label="Transfer (IUT)" accent="#0f766e" colSpan={rows.length + 1} />
            <CompareMetricRow
              label="Materials"
              cells={rows.map((r) => ({
                key: r.option.id,
                content: (
                  <>
                    {r.iutSummary.materialCount}
                    {r.iutSummary.slaBreachCount > 0 && (
                      <span className="block text-[9px] font-semibold mt-0.5" style={{ color: "#b45309" }}>{r.iutSummary.slaBreachCount} breach SLA</span>
                    )}
                  </>
                ),
              }))}
            />
            <CompareMetricRow
              label="Total Transfer Qty"
              cells={rows.map((r) => ({ key: r.option.id, content: `${formatIndianNumber(r.iutSummary.totalQty)} EA` }))}
            />
            <CompareMetricRow
              label="Longest Lead Time"
              cells={rows.map((r, i) => ({ key: r.option.id, content: `${r.iutSummary.maxLeadTimeDays}d`, tag: leadTimeTags[i] }))}
            />
            <tr style={{ borderTop: "1px solid #f1f5f9" }}>
              <td className="px-4 py-3 text-[12px]" style={{ color: "#475569", borderRight: "1px solid #e2e8f0" }}>Lane Availability</td>
              {rows.map(({ option }) => (
                <td key={option.id} className="px-4 py-3 text-center">{laneBadge(option.laneAvailable)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const cardBody = (
    <>
      <div
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
      >
        <span className="text-xs font-bold truncate" style={{ color: C.navy }}>IUT + Procurement</span>
        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className="flex items-center cursor-pointer justify-center rounded-md shrink-0 transition-colors hover:bg-slate-100"
          style={{ width: 24, height: 24, color: "#64748b", border: "1px solid #e2e8f0" }}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      <div style={isFullscreen ? { flex: "1 1 auto", overflow: "auto" } : undefined}>
        <div
          className="px-4 py-2 flex items-center justify-between gap-2 flex-wrap"
          style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
        >
          <div className="inline-flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "#f1f5f9" }}>
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
              style={viewMode === "single" ? { backgroundColor: "#fff", color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#64748b" }}
            >
              <Workflow size={12} />
              Pipeline View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compare")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
              style={viewMode === "compare" ? { backgroundColor: "#fff", color: C.navy, boxShadow: "0 1px 2px rgba(0,0,0,0.08)" } : { color: "#64748b" }}
            >
              <GitCompareArrows size={12} />
              Compare Options
            </button>
          </div>
        </div>

        {viewMode === "single" ? (
          <>
            <div
              className="px-4 py-2.5 flex items-center gap-2 flex-wrap"
              style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#94a3b8" }}>
                Quick Compare
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FOCUS_VIEW_OPTIONS.map((o, i) => {
                  const isActive = activeOption.id === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setActiveOptionId(o.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isActive ? C.navy : "#fff",
                        color: isActive ? "#fff" : "#64748b",
                        border: `1px solid ${isActive ? C.navy : "#e2e8f0"}`,
                      }}
                    >
                      {o.isBest && <Star size={9} fill="currentColor" style={{ color: isActive ? "#86efac" : "#16a34a" }} />}
                      Option {i + 1}
                      {selectedOptionId === o.id && (
                        <Check size={10} strokeWidth={3} style={{ color: isActive ? "#86efac" : C.green }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-4">
              {renderOptionCard(activeOption, activeIdx)}
            </div>
          </>
        ) : (
          <div className="p-4">
            {renderCompareTable()}
          </div>
        )}
      </div>
    </>
  );

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 flex flex-col bg-white" style={{ zIndex: 100 }}>
        {cardBody}
      </div>,
      document.body,
    );
  }

  return (
    <div className="p-6">
      <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}>
        {cardBody}
      </div>
    </div>
  );
}
