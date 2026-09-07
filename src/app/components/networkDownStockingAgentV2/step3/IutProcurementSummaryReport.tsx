import type React from "react";
import { useState } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Clock,
  Link2Off,
  ShoppingCart,
  Star,
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
  type ProcurementMaterialLine,
} from "../../../constants/networkDownStockingAgent";
import { C, RM_BADGE, PM_BADGE } from "../../sciDetails/constants";
import { formatIndianNumber } from "../../sciDetails/utils";

// Report is capped at the best 2 routing options — same "side by side" scope as the rest of
// this popup family.
const OPTIONS = FOCUS_VIEW_OPTIONS.slice(0, 2);
// Line-item tables show this many rows before collapsing the rest behind "Show N more".
const DEFAULT_VISIBLE_ROWS = 3;
const REPORT_MIN_WIDTH = 760;

function materialTag(type: "RM" | "PM") {
  const badge = type === "RM" ? RM_BADGE : PM_BADGE;
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0" style={{ backgroundColor: badge.bg, color: badge.color }}>
      {type}
    </span>
  );
}

function laneNote(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: C.green }}>
        <Check size={10} strokeWidth={2.5} />Lane available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#ea580c" }}>
        <Link2Off size={10} />Lane unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#d97706" }}>
      <Clock size={10} />Lane not set
    </span>
  );
}

/** Plain section label — an icon and a title, no heavy color band, kept consistent across
    the Summary and every Details table so the whole report reads as one simple document. */
function SectionLabel({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span style={{ color: C.navy }}>{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.navy }}>{title}</span>
      {subtitle && <span className="text-[11px]" style={{ color: "#94a3b8" }}>{subtitle}</span>}
    </div>
  );
}

/** A simple field-column table: one row per item, one column per field — no text cramming.
    Shows the first few rows, with "Show N more" to reveal the rest. */
function SimpleTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE_ROWS);
  const hiddenCount = rows.length - DEFAULT_VISIBLE_ROWS;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #eef2f7" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c}
                className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap ${i === 0 ? "text-left" : "text-right"}`}
                style={{ color: "#94a3b8", backgroundColor: "#f8fafc", borderBottom: "1px solid #eef2f7" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((cells, ri) => (
            <tr key={ri} style={{ borderBottom: ri === shown.length - 1 && hiddenCount <= 0 ? undefined : "1px solid #f5f7fa" }}>
              {cells.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2.5 text-[12px] ${ci === 0 ? "text-left" : "text-right"}`} style={{ color: "#374151" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {hiddenCount > 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-2 text-center" style={{ backgroundColor: "#f8fafc" }}>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                  style={{ color: C.blue }}
                >
                  {expanded ? "Show less" : `Show ${hiddenCount} more`}
                  <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function iutRow(m: IutTransferMaterialLine): React.ReactNode[] {
  const breach = m.leadTimeDays > IUT_TRANSFER_SLA_DAYS;
  return [
    <span key="m" className="flex items-center gap-1.5 flex-wrap">
      {materialTag(m.type)}
      <span className="font-semibold" style={{ color: C.navy }}>{m.name}</span>
      <span style={{ color: "#94a3b8" }}>· {m.code}</span>
      {breach && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>SLA</span>}
    </span>,
    <span key="q" className="tabular-nums font-semibold">{m.transferQty.toLocaleString("en-IN")} EA</span>,
    <span key="l" className="tabular-nums">{m.leadTimeDays}d</span>,
    <span key="i" className="whitespace-nowrap">{m.initiationDate}</span>,
    <span key="c" className="tabular-nums whitespace-nowrap">₹{m.costPerTrip}</span>,
  ];
}

function procRow(p: ProcurementMaterialLine): React.ReactNode[] {
  const belowMoq = p.neededQty < p.moq;
  return [
    <span key="m" className="flex items-center gap-1.5 flex-wrap">
      {materialTag(p.type)}
      <span className="font-semibold" style={{ color: C.navy }}>{p.name}</span>
      {belowMoq && <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: "#fffbeb", color: "#b45309" }}>Below MOQ</span>}
    </span>,
    <span key="s" className="font-semibold whitespace-nowrap" style={{ color: C.blue }}>{p.supplier}</span>,
    <span key="q" className="tabular-nums whitespace-nowrap">{formatIndianNumber(p.orderQty)} <span style={{ color: "#94a3b8" }}>MOQ {formatIndianNumber(p.moq)}</span></span>,
    <span key="pr" className="tabular-nums">₹{p.pricePerUnit}</span>,
    <span key="et" className="tabular-nums font-semibold whitespace-nowrap" style={{ color: C.navy }}>₹{formatIndianNumber(p.orderQty * p.pricePerUnit)}</span>,
    <span key="pd" className="whitespace-nowrap">{p.productionDate}</span>,
  ];
}

const SUMMARY_TONE_COLOR: Record<"cost" | "fg" | "neutral" | "warn", string> = {
  cost: "#c2410c",
  fg: "#166534",
  neutral: C.navy,
  warn: "#b45309",
};

function SummaryValue({ value, tone, note }: { value: React.ReactNode; tone: "cost" | "fg" | "neutral" | "warn"; note?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-bold tabular-nums" style={{ color: SUMMARY_TONE_COLOR[tone] }}>{value}</span>
      {note && <span className="text-[9px] font-semibold" style={{ color: "#b45309" }}>{note}</span>}
    </div>
  );
}

type OptionMetrics = ReturnType<typeof buildOptionMetrics>;

function buildOptionMetrics(option: FocusViewOption) {
  const materials = FOCUS_VIEW_IUT_MATERIALS[option.id];
  const procurement = FOCUS_VIEW_PROCUREMENT[option.id];
  return {
    option,
    materials,
    procurement,
    iutSummary: summarizeIutMaterials(materials),
    procurementSummary: summarizeProcurement(procurement),
    totalFg: option.plants[0].finalFgProducible + option.plants[1].finalFgProducible,
    planChangeCount: option.plants.filter((p) => p.planChangeRequired).length,
  };
}

/** Top-of-report scoreboard — the "relevant information" to read first, one small table
    comparing both options metric by metric before anyone scrolls into the details below. */
function SummarySection({
  perOption,
  selectedId,
  onSelect,
}: {
  perOption: OptionMetrics[];
  selectedId: FocusViewOption["id"];
  onSelect: (id: FocusViewOption["id"]) => void;
}) {
  const totalCostTags = tagComparisonValues(perOption.map((r) => r.option.totalCost), false);
  const totalFgTags = tagComparisonValues(perOption.map((r) => r.totalFg), true);

  const row = (
    label: string,
    cells: { value: React.ReactNode; tone: "cost" | "fg" | "neutral" | "warn"; note?: string; tag?: ComparisonTag }[],
  ) => (
    <tr style={{ borderTop: "1px solid #f1f5f9" }}>
      <td className="px-4 py-3 text-[12px]" style={{ color: "#64748b", borderRight: "1px solid #eef2f7", backgroundColor: "#fafbfc" }}>
        {label}
      </td>
      {cells.map((cell, i) => (
        <td key={i} className="px-4 py-3 text-center" style={{ backgroundColor: cell.tag === "best" ? "#f0fdf4" : undefined, borderLeft: i > 0 ? "1px solid #eef2f7" : undefined }}>
          <SummaryValue value={cell.value} tone={cell.tag === "best" ? "fg" : cell.tone} note={cell.note} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
        <SectionLabel icon={<Star size={12} />} title="Summary" subtitle="Key figures for both options, at a glance" />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", backgroundColor: "#fff", borderRight: "1px solid #eef2f7", borderBottom: "1px solid #e2e8f0" }}>
              Detail
            </th>
            {perOption.map(({ option }, i) => {
              const isSelected = selectedId === option.id;
              return (
                <th
                  key={option.id}
                  className="px-4 py-2.5 text-center"
                  style={{ backgroundColor: "#fff", borderBottom: `1px solid ${isSelected ? C.blue : "#e2e8f0"}`, borderLeft: i > 0 ? "1px solid #eef2f7" : undefined }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <span className="text-[12px] font-bold" style={{ color: C.navy }}>{option.label}</span>
                      {option.isBest && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                          <Star size={8} fill="currentColor" />Best
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>{option.routeFrom} → {option.routeTo}</span>
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={() => onSelect(option.id)}
                      className="mt-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-opacity"
                      style={{ backgroundColor: isSelected ? "#dcfce7" : C.blue, color: isSelected ? "#166534" : "#fff", cursor: isSelected ? "default" : "pointer" }}
                    >
                      {isSelected ? <span className="inline-flex items-center gap-1"><Check size={10} strokeWidth={3} />Selected</span> : "Select"}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {row("Total Cost", perOption.map((r, i) => ({ value: `₹${formatIndianNumber(r.option.totalCost)}`, tone: "cost", tag: totalCostTags[i] })))}
          {row("Total FG Producible", perOption.map((r, i) => ({ value: `${formatIndianNumber(r.totalFg)} EA`, tone: "fg", tag: totalFgTags[i] })))}
          {row("IUT Materials", perOption.map((r) => ({ value: r.iutSummary.materialCount, tone: r.iutSummary.slaBreachCount > 0 ? "warn" : "neutral", note: r.iutSummary.slaBreachCount > 0 ? `${r.iutSummary.slaBreachCount} SLA breach` : undefined })))}
          {row("Procurement Orders", perOption.map((r) => ({ value: r.procurementSummary.orderCount, tone: r.procurementSummary.attentionCount > 0 ? "warn" : "neutral", note: r.procurementSummary.attentionCount > 0 ? `${r.procurementSummary.attentionCount} below MOQ` : undefined })))}
          {row("Plan Changes", perOption.map((r) => ({ value: `${r.planChangeCount} of ${r.option.plants.length}`, tone: r.planChangeCount > 0 ? "warn" : "fg" })))}
        </tbody>
      </table>
    </div>
  );
}

/** One option's full breakdown — plain field-column tables, no cramming, grouped Procurement
    by plant. Sits in the "Details" area below the Summary, always visible (no card switcher). */
function OptionDetails({ metrics, isSelected }: { metrics: OptionMetrics; isSelected: boolean }) {
  const { option, materials, procurement, iutSummary, procurementSummary } = metrics;

  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: isSelected ? `2px solid ${C.blue}` : "1px solid #e2e8f0" }}>
      <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ backgroundColor: isSelected ? C.bgBlue : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <span className="text-sm font-bold" style={{ color: C.navy }}>{option.label}</span>
        {option.isBest && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
            <Star size={9} fill="currentColor" />Recommended
          </span>
        )}
        <span className="text-[11px]" style={{ color: "#475569" }}>{option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo}</span>
        {laneNote(option.laneAvailable)}
        {isSelected && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
            <Check size={10} strokeWidth={3} />Selected
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SectionLabel
            icon={<ArrowLeftRight size={12} />}
            title="IUT Flow"
            subtitle={`${iutSummary.materialCount} material${iutSummary.materialCount === 1 ? "" : "s"} · ${formatIndianNumber(iutSummary.totalQty)} EA · max ${iutSummary.maxLeadTimeDays}d lead`}
          />
          <SimpleTable columns={["Material", "Qty", "Lead", "Initiation", "Cost/Trip"]} rows={materials.map(iutRow)} />
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel
            icon={<ShoppingCart size={12} />}
            title="Procurement"
            subtitle={`${procurementSummary.orderCount} orders · ${procurementSummary.supplierCount} suppliers · ₹${formatIndianNumber(procurementSummary.totalValue)}`}
          />
          <div className="flex flex-col gap-3">
            {option.plants.map((plant) => {
              const plantOrders = procurement.filter((p) => p.plant === plant.code);
              if (plantOrders.length === 0) return null;
              return (
                <div key={plant.code} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.code}</span>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                      FG Producible <b style={{ color: C.navy }}>{formatIndianNumber(plant.finalFgProducible)}</b> · Stop {plant.stopDate}
                    </span>
                    {plant.planChangeRequired ? (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#fffbeb", color: "#b45309" }}>Plan change needed</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>No plan change</span>
                    )}
                  </div>
                  <SimpleTable columns={["Material", "Supplier", "Order Qty", "Price/Unit", "Est. Total", "Production"]} rows={plantOrders.map(procRow)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "IUT + Procurement New" row's More Details content — a clean, simple report: a Summary
 * table up top comparing both options metric by metric, then the full IUT/Procurement
 * breakdown for each option below it as plain field-column tables. No per-option card
 * switcher and no cramming multiple fields into one cell.
 */
export function IutProcurementSummaryReport() {
  const [selectedId, setSelectedId] = useState<FocusViewOption["id"]>(
    () => OPTIONS.find((o) => o.isBest)?.id ?? OPTIONS[0].id,
  );
  const perOption = OPTIONS.map(buildOptionMetrics);

  return (
    <div className="flex flex-col gap-6" style={{ minWidth: REPORT_MIN_WIDTH }}>
      <SummarySection perOption={perOption} selectedId={selectedId} onSelect={setSelectedId} />

      <div className="flex flex-col gap-3">
        <SectionLabel icon={<ArrowLeftRight size={12} />} title="Details" subtitle="Full IUT and procurement breakdown, one option at a time" />
        <div className="flex flex-col gap-4">
          {perOption.map((metrics) => (
            <OptionDetails key={metrics.option.id} metrics={metrics} isSelected={selectedId === metrics.option.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
