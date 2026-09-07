import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Link2Off,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Star,
  X,
  Zap,
} from "lucide-react";
import { getComponentDescriptionByCode } from "../data";
import {
  C,
  type ScenarioRow,
  SCENARIOS,
  CUSTOM_SCENARIO,
  StepSection,
  ScenarioIcon,
  RM_BADGE,
  PM_BADGE,
  TRANSFER_OPTION_BASE,
  TRANSFER_SCENARIO_CONFIG,
  type TransferScenarioId,
  type MOQPlantOption,
  type MOQSupplierData,
  MOQ_PLANT_OPTIONS,
  IUT_TRANSFER_OPTIONS,
  type IUTOption,
  type PlantRole,
  CompactScenarioCard,
  StockTransferOptionsPanel,
  MOQProcurementOptionsPanel,
  MONTH_INDEX,
  MONTH_NAMES,
  formatIndianNumber,
  PLANT_BREAKDOWN_BASE,
  computeAfterQtyAndDate,
} from "../../pages/SCIDetails4";

/**
 * The "old" tabular Scenario Comparison Report step from SCIDetails4 (Step 3),
 * extracted out of the page's original inline implementation into its own
 * component. Kept intentionally as the dense multi-column table design
 * (as opposed to the newer card-based report layout used elsewhere) — this
 * is a straight code-move, not a redesign.
 */

type CompBreakdownRow = {
  plant: string;
  productionPlan: string;
  componentCode: string;
  description: string;
  type: "RM" | "PM";
  onHandStock: string;
  openPO: string;
  unitPrice: string;
};

const COMP_BREAKDOWN_ROWS: CompBreakdownRow[] = [
  {
    plant: "U535",
    productionPlan: "4,44,444 EA",
    componentCode: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    type: "PM",
    onHandStock: "55,200",
    openPO: "—",
    unitPrice: "₹0.50",
  },
  {
    plant: "U535",
    productionPlan: "4,44,444 EA",
    componentCode: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    type: "RM",
    onHandStock: "1,00,000",
    openPO: "1,500",
    unitPrice: "₹15.00",
  },
  {
    plant: "UTR",
    productionPlan: "1,11,111 EA",
    componentCode: "65428959",
    description: getComponentDescriptionByCode("65428959"),
    type: "PM",
    onHandStock: "11,700",
    openPO: "1,12,000",
    unitPrice: "₹0.06",
  },
  {
    plant: "UTR",
    productionPlan: "1,11,111 EA",
    componentCode: "65284824",
    description: getComponentDescriptionByCode("65284824"),
    type: "RM",
    onHandStock: "140",
    openPO: "1,000",
    unitPrice: "₹15.00",
  },
];

type CustomOverrideRow = {
  id: string;
  componentCode: string;
  plant: string;
  onHandStock: string;
  productionPlan: string;
  conversionFactor: string;
};

const CUSTOM_OVERRIDE_COMPONENT_OPTIONS = Array.from(
  new Set(COMP_BREAKDOWN_ROWS.map((r) => r.componentCode)),
);
const CUSTOM_OVERRIDE_PLANT_OPTIONS = Array.from(
  new Set(COMP_BREAKDOWN_ROWS.map((r) => r.plant)),
);

function lookupBaselineComp(componentCode: string, plant: string) {
  return COMP_BREAKDOWN_ROWS.find(
    (r) => r.componentCode === componentCode && r.plant === plant,
  );
}

function CustomOverridesForm({
  rows,
  onRowsChange,
  onRun,
}: {
  rows: CustomOverrideRow[];
  onRowsChange: (rows: CustomOverrideRow[]) => void;
  onRun: () => void;
}) {
  const addRow = () => {
    onRowsChange([
      ...rows,
      {
        id: `custom-row-${Date.now()}-${rows.length}`,
        componentCode: "",
        plant: "",
        onHandStock: "",
        productionPlan: "",
        conversionFactor: "",
      },
    ]);
  };

  const loadFromBaseline = () => {
    onRowsChange(
      COMP_BREAKDOWN_ROWS.map((r, idx) => ({
        id: `custom-row-baseline-${idx}`,
        componentCode: r.componentCode,
        plant: r.plant,
        onHandStock: r.onHandStock,
        productionPlan: r.productionPlan,
        conversionFactor: r.unitPrice,
      })),
    );
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, patch: Partial<CustomOverrideRow>) => {
    onRowsChange(
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        if (patch.componentCode !== undefined || patch.plant !== undefined) {
          const baseline = lookupBaselineComp(next.componentCode, next.plant);
          if (baseline) {
            next.onHandStock = baseline.onHandStock;
            next.productionPlan = baseline.productionPlan;
            next.conversionFactor = baseline.unitPrice;
          }
        }
        return next;
      }),
    );
  };

  const [showErrors, setShowErrors] = useState(false);
  const incomplete = rows.some(
    (r) => !r.componentCode || !r.plant || !r.onHandStock || !r.productionPlan,
  );

  const handleRunCustomScenario = () => {
    if (rows.length === 0 || incomplete) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    toast.success("Custom scenario computed", {
      description: `${rows.length} override row${rows.length > 1 ? "s" : ""} applied`,
      duration: 3000,
    });
    onRun();
  };

  const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", color: "#111827" };
  const errorStyle: React.CSSProperties = { border: "1px solid #dc2626", color: "#111827", backgroundColor: "#fef2f2" };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}
    >
      <div className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#ecfdf5" }}
          >
            <Pencil size={18} style={{ color: "#e11d48" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Custom Overrides
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Enter on-hand stock per plant &amp; component. Production plan and
              conversion factor default from baseline.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadFromBaseline}
          className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0"
          style={{ backgroundColor: "#ecfdf5", color: C.teal, border: "1px solid #99f6e4" }}
        >
          <Copy size={12} />
          Load from baseline
        </button>
      </div>

      <div className="overflow-x-auto" style={{ borderTop: "1px solid #f1f5f9" }}>
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {[
                { label: "Component", required: true },
                { label: "Plant", required: true },
                { label: "On-hand Stock", required: true },
                { label: "Production Plan", required: true },
                { label: "Conversion Factor", required: false },
                { label: "", required: false },
              ].map((h, i) => (
                <th
                  key={h.label || `col-${i}`}
                  className="px-3 py-2 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#94a3b8", fontSize: 9 }}
                >
                  {h.label}
                  {h.required && <span style={{ color: "#dc2626" }}> *</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs italic"
                  style={{ color: showErrors ? "#dc2626" : "#94a3b8" }}
                >
                  {showErrors
                    ? "Add at least one row and complete all required fields."
                    : (
                      <>
                        No override rows yet. Click{" "}
                        <button
                          type="button"
                          onClick={addRow}
                          className="font-normal not-italic hover:underline text-[11px]"
                          style={{ color: C.teal }}
                        >
                          &ldquo;Add row&rdquo;
                        </button>{" "}
                        or{" "}
                        <button
                          type="button"
                          onClick={loadFromBaseline}
                          className="font-normal not-italic hover:underline text-[11px]"
                          style={{ color: C.teal }}
                        >
                          &ldquo;Load from baseline&rdquo;
                        </button>{" "}
                        to begin.
                      </>
                    )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-2">
                    <select
                      value={row.componentCode}
                      onChange={(e) => updateRow(row.id, { componentCode: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.componentCode ? errorStyle : inputStyle}
                    >
                      <option value="">Select...</option>
                      {CUSTOM_OVERRIDE_COMPONENT_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.plant}
                      onChange={(e) => updateRow(row.id, { plant: e.target.value })}
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.plant ? errorStyle : inputStyle}
                    >
                      <option value="">Select...</option>
                      {CUSTOM_OVERRIDE_PLANT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.onHandStock}
                      onChange={(e) => updateRow(row.id, { onHandStock: e.target.value })}
                      placeholder="e.g. 55,200"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.onHandStock ? errorStyle : inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.productionPlan}
                      onChange={(e) => updateRow(row.id, { productionPlan: e.target.value })}
                      placeholder="e.g. 4,44,444 EA"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={showErrors && !row.productionPlan ? errorStyle : inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.conversionFactor}
                      onChange={(e) => updateRow(row.id, { conversionFactor: e.target.value })}
                      placeholder="e.g. 1.00"
                      className="px-2 py-1 rounded-lg text-xs focus:outline-none w-full"
                      style={inputStyle}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="shrink-0"
                      style={{ color: "#94a3b8" }}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderTop: "1px solid #f1f5f9" }}
      >
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
          style={{ backgroundColor: "#ffffff", color: C.navy, border: "1px solid #d1d5db" }}
        >
          <Plus size={12} />
          Add row
        </button>
        <div className="flex items-center gap-2">
          {showErrors && (rows.length === 0 || incomplete) && (
            <span className="text-[11px] font-semibold" style={{ color: "#dc2626" }}>
              Complete all required fields highlighted in red.
            </span>
          )}
          <button
            type="button"
            onClick={handleRunCustomScenario}
            className="inline-flex items-center cursor-pointer gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: C.teal, color: "#fff" }}
          >
            <Zap size={12} />
            Run custom scenario
          </button>
        </div>
      </div>
    </div>
  );
}
const SCENARIO_COMP_VALUES: Record<
  string,
  Record<string, { producible: string; leftoverQty: string; leftoverVal: string }>
> = {
  "no-action": {
    "65428959": { producible: "55,200", leftoverQty: "Nil",   leftoverVal: "Nil" },
    "65284824": { producible: "55,200", leftoverQty: "1,025", leftoverVal: "₹15,375" },
  },
  iut: {
    "65428959": { producible: "67,789", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "67,789", leftoverQty: "184", leftoverVal: "₹2,756" },
  },
  "iut-moq": {
    "65428959": { producible: "70,214", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "70,214", leftoverQty: "173", leftoverVal: "₹2,600" },
  },
  moq: {
    "65428959": { producible: "56,840", leftoverQty: "Nil",   leftoverVal: "Nil" },
    "65284824": { producible: "56,840", leftoverQty: "315",   leftoverVal: "₹4,723" },
  },
  "iut-moq-break": {
    "65428959": { producible: "74,356", leftoverQty: "Nil", leftoverVal: "Nil" },
    "65284824": { producible: "74,356", leftoverQty: "100", leftoverVal: "₹1,500" },
  },
};

// Raw production-stop date per site, per scenario (site omitted where that site isn't producing)
const SITE_PRODUCTION_STOP_DATES: Record<string, Record<string, string>> = {
  "no-action": { U535: "29 May 2026" },
  iut: { UTR: "25 May 2026", U535: "19 Jun 2026" },
  "iut-moq": { UTR: "25 May 2026", U535: "22 Jun 2026" },
  moq: { U535: "04 Jun 2026" },
  "iut-moq-break": { UTR: "25 May 2026", U535: "28 Jun 2026" },
};
// End of that production week (Sunday) for a "DD Mon YYYY" date string
function getProductionWeekEndDate(dateStr: string): string {
  const [day, mon, year] = dateStr.split(" ");
  const d = new Date(parseInt(year, 10), MONTH_INDEX[mon], parseInt(day, 10));
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
function ScenarioComparisonPanel({
  scenarioIds,
  onClose,
  extraScenarios = [],
}: {
  scenarioIds: string[];
  onClose: () => void;
  extraScenarios?: ScenarioRow[];
}) {
  const allScenarios = [...SCENARIOS, ...extraScenarios];
  const scenarios = scenarioIds
    .map((id) => allScenarios.find((s) => s.id === id)!)
    .filter(Boolean);

  const [filter, setFilter] = useState("");

  const filteredComps = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return COMP_BREAKDOWN_ROWS;
    return COMP_BREAKDOWN_ROWS.filter(
      (c) =>
        c.plant.toLowerCase().includes(q) ||
        c.componentCode.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    );
  }, [filter]);

  const groupedByPlant = useMemo(() => {
    const map = new Map<string, { productionPlan: string; rows: typeof filteredComps }>();
    for (const row of filteredComps) {
      if (!map.has(row.plant)) {
        map.set(row.plant, { productionPlan: row.productionPlan, rows: [] });
      }
      map.get(row.plant)!.rows.push(row);
    }
    return Array.from(map.entries()).map(([plant, { productionPlan, rows }]) => ({ plant, productionPlan, rows }));
  }, [filteredComps]);

  const FIXED_COLS = 4; // Component, On-hand Stock, Open PO, Unit Price

  return (
    <div
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        border: `1.5px solid ${C.borderBlue}`,
        boxShadow: "0 4px 20px rgba(21,101,192,0.10)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-3 gap-4"
        style={{ backgroundColor: C.navy }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="text-sm font-bold text-white shrink-0">
            Scenario Comparison
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {scenarios.map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: s.isBest
                    ? "rgba(22,163,74,0.25)"
                    : "rgba(255,255,255,0.12)",
                  color: s.isBest ? "#86efac" : "#e2e8f0",
                  border: s.isBest
                    ? "1px solid rgba(22,163,74,0.4)"
                    : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Section title + filter */}
      <div
        className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
      >
        <div>
          {/* <p className="text-sm font-bold" style={{ color: C.navy }}>
            Component Breakdown — Scenario Comparison
          </p> */}
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            Consumed and leftover by component across all compared scenarios
          </p>
        </div>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#94a3b8" }}
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter plant or component..."
            className="pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none"
            style={{ border: "1px solid #d1d5db", minWidth: 220, color: "#111827" }}
          />
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden">
        <table
          className="w-full text-xs"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            {/* Group header row */}
            <tr>
              <th
                colSpan={FIXED_COLS}
                className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: C.navy,
                  color: "rgba(255,255,255,0.5)",
                  borderBottom: "2px solid rgba(255,255,255,0.12)",
                }}
              >
                Component Details
              </th>
              {scenarios.map((s) => (
                <th
                  key={s.id}
                  colSpan={2}
                  className="px-2 py-2 text-center text-[11px] font-bold whitespace-nowrap"
                  style={{
                    backgroundColor: s.id === "no-action" ? "#374151" : C.navy,
                    color: s.isBest ? "#86efac" : "#e2e8f0",
                    borderLeft: "2px solid rgba(255,255,255,0.15)",
                    borderBottom: `2px solid ${s.isBest ? C.green : "rgba(255,255,255,0.15)"}`,
                  }}
                >
                  {s.name}
                </th>
              ))}
            </tr>
            {/* Column header row */}
            <tr style={{ backgroundColor: "#f0f4f8", borderBottom: "1px solid #d1d5db" }}>
              <th
                className="px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "22%", borderRight: "1px solid #e2e8f0" }}
              >
                Component
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "8%" }}
              >
                On-hand
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "7%" }}
              >
                Open PO
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
              </th>
              <th
                className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b", width: "7%", borderRight: "2px solid #d1d5db" }}
              >
                Unit Price
                <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>₹ / Unit</div>
              </th>
              {scenarios.map((s) => (
                <React.Fragment key={s.id}>
                  <th
                    className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b", borderLeft: "2px solid #d1d5db" }}
                  >
                    Producible FG
                    <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>FG EA</div>
                  </th>
                  <th
                    className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b" }}
                  >
                    Leftover RMPM
                    <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>EA · ₹</div>
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredComps.length === 0 ? (
              <tr>
                <td
                  colSpan={FIXED_COLS + scenarios.length * 2}
                  className="px-4 py-8 text-center italic"
                  style={{ color: "#94a3b8" }}
                >
                  No components match your filter
                </td>
              </tr>
            ) : (
              groupedByPlant.map(({ plant, productionPlan, rows }) => (
                <React.Fragment key={plant}>
                  {/* Plant separator row */}
                  <tr style={{ backgroundColor: "#f0f4f8", borderTop: "2px solid #d1d5db", borderBottom: "1px solid #d1d5db" }}>
                    <td
                      colSpan={FIXED_COLS}
                      className="px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: C.navy }}>{plant}</span>
                        <span className="text-[10px]" style={{ color: "#64748b" }}>
                          Production Plan: <span className="font-semibold" style={{ color: C.navy }}>{productionPlan}</span>
                        </span>
                      </div>
                    </td>
                    {scenarios.map((s) => {
                      const rawStopDate = SITE_PRODUCTION_STOP_DATES[s.id]?.[plant];
                      const weekEndDate = rawStopDate ? getProductionWeekEndDate(rawStopDate) : null;
                      return (
                        <td
                          key={s.id}
                          colSpan={2}
                          className="px-2 py-1.5 text-center"
                          style={{ borderLeft: "2px solid #d1d5db" }}
                        >
                          {weekEndDate ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap"
                              style={{ color: C.navy }}
                            >
                              <Calendar size={10} />
                              Prod. End (wk): {weekEndDate}
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: "#cbd5e1" }}>
                              No production
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {rows.map((comp, rowIdx) => {
                    const badge = comp.type === "PM" ? PM_BADGE : RM_BADGE;
                    return (
                      <tr
                        key={`${plant}-${comp.componentCode}`}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {/* Component: RM/PM badge + code + name below */}
                        <td className="px-2 py-2.5 align-top" style={{ borderRight: "1px solid #e2e8f0" }}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              {comp.type}
                            </span>
                            <span className="font-semibold text-xs" style={{ color: "#111827" }}>
                              {comp.componentCode}
                            </span>
                          </div>
                          {comp.description && (
                            <p className="text-[10px] leading-snug" style={{ color: "#64748b" }}>
                              {comp.description}
                            </p>
                          )}
                        </td>
                        {/* On-hand stock */}
                        <td className="px-2 py-2.5 text-center tabular-nums font-medium text-xs" style={{ color: "#374151" }}>
                          {comp.onHandStock}
                        </td>
                        {/* Open PO */}
                        <td className="px-2 py-2.5 text-center tabular-nums font-medium text-xs" style={{ color: comp.openPO !== "—" ? "#374151" : "#94a3b8" }}>
                          {comp.openPO}
                        </td>
                        {/* Unit Price */}
                        <td className="px-2 py-2.5 text-center tabular-nums text-xs" style={{ color: "#374151", borderRight: "2px solid #d1d5db" }}>
                          {comp.unitPrice}
                        </td>
                        {/* Per-scenario columns */}
                        {scenarios.map((s) => {
                          const vals = SCENARIO_COMP_VALUES[s.id]?.[comp.componentCode];
                          const isNil = !vals || vals.leftoverQty === "Nil";
                          return (
                            <React.Fragment key={s.id}>
                              <td className="px-2 py-2.5 text-center tabular-nums font-semibold text-xs" style={{ color: "#374151", borderLeft: "2px solid #e2e8f0" }}>
                                {vals?.producible ?? "—"}
                              </td>
                              <td className="px-2 py-2.5 text-center align-top">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="tabular-nums font-semibold text-xs" style={{ color: isNil ? C.green : "#dc2626" }}>
                                    {vals?.leftoverQty ?? "—"}
                                  </span>
                                  {!isNil && vals?.leftoverVal && (
                                    <span className="tabular-nums text-[10px] font-medium" style={{ color: "#dc2626" }}>
                                      {vals.leftoverVal}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function getCardDefs(sid: string): { sid: string; transferId: TransferScenarioId | null }[] {
  const isCombo = sid === "iut-moq" || sid === "iut-moq-break";
  return isCombo
    ? [
        { sid: "iut", transferId: "iut" as TransferScenarioId },
        { sid: "moq", transferId: "moq" as TransferScenarioId },
      ]
    : [
        {
          sid,
          transferId: sid === "iut" ? ("iut" as TransferScenarioId) : sid === "moq" ? ("moq" as TransferScenarioId) : null,
        },
      ];
}

export function ScenarioComparisonStep({
  acceptedId,
  onSelect,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  acceptedId: string | null;
  onSelect: (id: string) => void;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;
  const baselineDays = parseInt(baseline.fgDaysCover ?? "0");

  const ranked = useMemo(
    () =>
      [...SCENARIOS]
        .filter((s) => s.id !== "no-action")
        .sort((a, b) => {
          const parse = (v: string | null) =>
            v ? parseFloat(v.replace(/[₹,]/g, "")) : Infinity;
          return parse(a.businessWaste) - parse(b.businessWaste);
        }),
    [],
  );

  const [showAcceptReasonModal, setShowAcceptReasonModal] = useState(false);
  const [acceptReasonText, setAcceptReasonText] = useState("");
  const [pendingScenario, setPendingScenario] = useState<ScenarioRow | null>(null);

  const confirmAccept = (scenario: ScenarioRow) => {
    onSelect(scenario.id);
    const parts = [
      `Scenario: ${scenario.name}`,
      `Business Waste: ${scenario.businessWaste}`,
      ...(scenario.wasteSavings ? [`Savings: ↓ ${scenario.wasteSavings}`] : []),
      `FG Cover: ${scenario.fgDaysCover}`,
    ];
    toast.success(`${scenario.nextAction}`, {
      description: parts.join("  ·  "),
      duration: 5000,
    });
  };

  const handleAccept = (scenario: ScenarioRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scenario.isBest) {
      setPendingScenario(scenario);
      setShowAcceptReasonModal(true);
    } else {
      confirmAccept(scenario);
    }
  };

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (compareIds.size < 2) setShowComparison(false);
  }, [compareIds]);

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareIds((prev) => {
      if (!prev.has(id) && prev.size >= 3) {
        toast.warning("Max 3 scenarios", {
          description: "Remove one before adding another.",
          duration: 3000,
        });
        return prev;
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [customOverrideRows, setCustomOverrideRows] = useState<CustomOverrideRow[]>([]);
  const [customScenarioRun, setCustomScenarioRun] = useState(false);
  const [customScenarioTableIndex, setCustomScenarioTableIndex] = useState(0);
  const [customScenarioResult, setCustomScenarioResult] = useState<{
    businessWaste: string;
    wasteSavings: string | null;
    wasteColor: "teal" | "orange";
    fgDaysCover: string;
  } | null>(null);

  const handleCustomAccept = () => {
    toast.success("Custom scenario accepted", {
      description: `${customOverrideRows.length} override row${customOverrideRows.length === 1 ? "" : "s"} applied`,
      duration: 5000,
    });
  };

  const CUSTOM_SCENARIO_TABLE_IDS = ["iut", "moq", "iut-moq", "iut-moq-break"];

  const handleCustomScenarioRun = () => {
    const bestScenario = SCENARIOS.find((s) => s.isBest)!;
    const parseWaste = (v: string | null) => (v ? parseFloat(v.replace(/[₹,]/g, "")) : 5541);
    const parseCover = (v: string | null) => (v ? parseInt(v, 10) : baselineDays);

    const baseWaste = parseWaste(bestScenario.businessWaste);
    const baseCover = parseCover(bestScenario.fgDaysCover);

    const rowCount = customOverrideRows.length;
    const waste = Math.max(0, Math.round(baseWaste - rowCount * 110));
    const cover = baseCover + Math.round(rowCount * 0.5);
    const savings = 5541 - waste;
    const pct = (savings / 5541) * 100;

    setCustomScenarioResult({
      businessWaste: `₹${waste.toLocaleString("en-IN")}`,
      wasteSavings: savings > 0 ? `₹${savings.toLocaleString("en-IN")}` : null,
      wasteColor: pct >= 40 ? "teal" : "orange",
      fgDaysCover: `${cover}d`,
    });
    setCustomScenarioTableIndex((prev) => (customScenarioRun ? (prev + 1) % CUSTOM_SCENARIO_TABLE_IDS.length : 0));
    setCustomScenarioRun(true);
  };

  const TABLE_HEADERS = [
    "Scenario",
    "Business Waste",
    "FG Days Cover",
    "Next Action",
    "",
    "",
  ];

  return (
    <StepSection
      step={3}
      title="Scenario Comparison Report"
      subtitle="System-generated · select a row to view component breakdown below"
    >
      {/* ── Expand/collapse hint — kept prominent above the table so the interaction isn't missed ── */}
      <div
        className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}` }}
        title="Click any scenario row to expand its component breakdown inline. Click the row again to collapse it."
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
          style={{ backgroundColor: C.blue }}
        >
          <ChevronDown size={12} style={{ color: "#fff" }} />
        </span>
        <span className="text-xs font-bold" style={{ color: C.navy }}>
          Click a row to expand its details inline
        </span>
        <span className="text-[11px]" style={{ color: C.blue }}>
          — click again to collapse
        </span>
      </div>

      {/* ── Comparison table ── */}
      <div
        className="overflow-x-auto rounded-xl"
        style={{ border: "1px solid #e2e8f0" }}
      >
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#ffffff", fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Ranked scenarios */}
            {ranked.map((scenario, idx) => {
              const rank = idx + 1;
              const isSelected = acceptedId === scenario.id;
              const coverDelta = parseInt(scenario.fgDaysCover ?? "0") - baselineDays;
              const inCompare = compareIds.has(scenario.id);
              const isMaxed = !inCompare && compareIds.size >= 3;

              return (
                <React.Fragment key={scenario.id}>
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(scenario.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(scenario.id)}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    borderLeft: scenario.isBest && !isSelected ? `3px solid ${C.green}` : isSelected ? `3px solid ${C.blue}` : "3px solid transparent",
                    backgroundColor: isSelected
                      ? "#EFF4FB"
                      : scenario.isBest
                        ? "#f0fdf4"
                        : "#ffffff",
                    outline: isSelected ? `2px solid ${C.blue}` : undefined,
                    outlineOffset: isSelected ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  {/* Scenario */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ScenarioIcon icon={scenario.icon} isAccepted={isSelected} />
                      <span
                        className="font-semibold whitespace-nowrap"
                        style={{ color: isSelected ? C.blue : C.navy }}
                      >
                        {scenario.name}
                      </span>
                      {scenario.isBest && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                        >
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Business waste + savings */}
                  <td className="px-3 py-3">
                    <span
                      className="font-bold tabular-nums"
                      style={{
                        color: scenario.wasteColor === "teal" ? C.teal : "#dc2626",
                      }}
                    >
                      {scenario.businessWaste}
                    </span>
                    {scenario.wasteSavings && (() => {
                      const saved = parseFloat((scenario.wasteSavings ?? "").replace(/[₹,]/g, "")) || 0;
                      const pct = (saved / 5541) * 100;
                      const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                      return (
                        <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                          ↓ {scenario.wasteSavings}
                        </span>
                      );
                    })()}
                  </td>

                  {/* FG Cover */}
                  <td className="px-3 py-3">
                    <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
                      {scenario.fgDaysCover}
                    </span>
                    {coverDelta > 0 && (
                      <span
                        className="ml-1.5 font-semibold"
                        style={{ color: C.green, fontSize: 10 }}
                      >
                        +{coverDelta}d
                      </span>
                    )}
                  </td>

                  {/* Next action chip */}
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: isSelected ? "#dbeafe" : "#f1f5f9",
                        color: isSelected ? C.blue : "#64748b",
                        border: `1px solid ${isSelected ? C.borderBlue : "#e2e8f0"}`,
                      }}
                    >
                      {scenario.nextAction}
                    </span>
                  </td>

                  {/* Compare */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(scenario.id, e)}
                      disabled={isMaxed}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                      style={
                        inCompare
                          ? { backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }
                          : isMaxed
                          ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                          : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                      }
                    >
                      {inCompare ? (
                        <><Link2Off size={11} />Remove</>
                      ) : (
                        <><ChevronRight size={11} />Add to compare</>
                      )}
                    </button>
                  </td>

                  {/* Accept — only for selected row */}
                  <td className="px-3 py-3">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => handleAccept(scenario, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                        style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
                {/* Moved below the table — see "Scenario detail expansion (moved below table)" section */}
                </React.Fragment>
              );
            })}

            {/* No Action — baseline row */}
            {(() => {
              const isSelected = acceptedId === "no-action";
              const inCompare = compareIds.has(baseline.id);
              const isMaxed = !inCompare && compareIds.size >= 3;
              return (
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect("no-action")}
                  onKeyDown={(e) => e.key === "Enter" && onSelect("no-action")}
                  style={{
                    backgroundColor: isSelected ? "#fef2f2" : "#fff7f5",
                    borderTop: "2px dashed #fca5a5",
                    outline: isSelected ? "2px solid #dc2626" : undefined,
                    outlineOffset: isSelected ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ScenarioIcon icon="no-action" isAccepted={isSelected} />
                      <span className="font-semibold" style={{ color: "#64748b" }}>
                        {baseline.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                      >
                        BASE
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-bold tabular-nums" style={{ color: "#dc2626" }}>
                      {baseline.businessWaste}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-semibold" style={{ color: "#64748b" }}>
                      {baseline.fgDaysCover}
                    </span>
                  </td>

                  {/* Next action chip */}
                  <td className="px-3 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                      style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
                    >
                      {baseline.nextAction}
                    </span>
                  </td>

                  {/* Compare */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(baseline.id, e)}
                      disabled={isMaxed}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                      style={
                        inCompare
                          ? { backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }
                          : isMaxed
                          ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                          : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                      }
                    >
                      {inCompare ? (
                        <><Link2Off size={11} />Remove</>
                      ) : (
                        <><ChevronRight size={11} />Add to compare</>
                      )}
                    </button>
                  </td>

                  {/* Accept — only for selected row */}
                  <td className="px-3 py-3">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => handleAccept(baseline, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                        style={{ backgroundColor: "#dc2626", color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              );
            })()}

            {/* Custom — user-defined scenario */}
            {(() => {
              const isSelected = acceptedId === CUSTOM_SCENARIO.id;
              const inCompare = compareIds.has(CUSTOM_SCENARIO.id);
              const isMaxed = !inCompare && compareIds.size >= 3;
              return (
                <React.Fragment>
                <tr
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(CUSTOM_SCENARIO.id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(CUSTOM_SCENARIO.id)}
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    borderLeft: isSelected ? `3px solid ${C.blue}` : "3px solid transparent",
                    backgroundColor: isSelected ? "#EFF4FB" : "#ffffff",
                    outline: isSelected ? `2px solid ${C.blue}` : undefined,
                    outlineOffset: isSelected ? -1 : undefined,
                    cursor: "pointer",
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ScenarioIcon icon="custom" />
                      <span className="font-semibold whitespace-nowrap" style={{ color: isSelected ? C.blue : C.navy }}>
                        Custom
                      </span>
                    </div>
                  </td>

                  {customScenarioResult ? (
                    <>
                      {/* Business waste + savings */}
                      <td className="px-3 py-3">
                        <span
                          className="font-bold tabular-nums"
                          style={{
                            color: customScenarioResult.wasteColor === "teal" ? C.teal : "#dc2626",
                          }}
                        >
                          {customScenarioResult.businessWaste}
                        </span>
                        {customScenarioResult.wasteSavings && (() => {
                          const saved = parseFloat((customScenarioResult.wasteSavings ?? "").replace(/[₹,]/g, "")) || 0;
                          const pct = (saved / 5541) * 100;
                          const color = pct >= 40 ? C.teal : pct >= 20 ? "#d97706" : "#dc2626";
                          return (
                            <span className="ml-1.5 font-semibold tabular-nums" style={{ color, fontSize: 10 }}>
                              ↓ {customScenarioResult.wasteSavings}
                            </span>
                          );
                        })()}
                      </td>

                      {/* FG Cover */}
                      <td className="px-3 py-3">
                        <span className="font-semibold tabular-nums" style={{ color: "#374151" }}>
                          {customScenarioResult.fgDaysCover}
                        </span>
                        {(() => {
                          const coverDelta = parseInt(customScenarioResult.fgDaysCover ?? "0", 10) - baselineDays;
                          return coverDelta > 0 ? (
                            <span className="ml-1.5 font-semibold" style={{ color: C.green, fontSize: 10 }}>
                              +{coverDelta}d
                            </span>
                          ) : null;
                        })()}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-3" colSpan={2}>
                      <span className="text-xs italic" style={{ color: "#94a3b8" }}>
                        Enter overrides below
                      </span>
                    </td>
                  )}

                  <td className="px-3 py-3">
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  </td>

                  {/* Compare — only available once the custom scenario has been run */}
                  <td className="px-3 py-3" style={{ borderLeft: "1px solid #e2e8f0" }}>
                    {customScenarioRun && (
                      <button
                        type="button"
                        onClick={(e) => toggleCompare(CUSTOM_SCENARIO.id, e)}
                        disabled={isMaxed}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                        style={
                          inCompare
                            ? { backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }
                            : isMaxed
                            ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                            : { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }
                        }
                      >
                        {inCompare ? (
                          <><Link2Off size={11} />Remove</>
                        ) : (
                          <><ChevronRight size={11} />Add to compare</>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Accept — only while the Custom row is selected/expanded */}
                  <td className="px-3 py-3">
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomAccept();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all hover:opacity-90"
                        style={{ backgroundColor: C.green, color: "#fff", fontSize: 10 }}
                      >
                        <Check size={11} />
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
                {/* Moved below the table — see "Scenario detail expansion (moved below table)" section */}
                </React.Fragment>
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* Scenario detail expansion (moved below table) */}
      {acceptedId === CUSTOM_SCENARIO.id ? (
        <div className="mt-3 space-y-3">
          <CustomOverridesForm
            rows={customOverrideRows}
            onRowsChange={setCustomOverrideRows}
            onRun={handleCustomScenarioRun}
          />
          {customScenarioRun && (() => {
            const sid = CUSTOM_SCENARIO_TABLE_IDS[customScenarioTableIndex];
            return (
              <ScenarioDetailCard
                key={sid}
                scenarioId={sid}
                cardDefs={getCardDefs(sid)}
                selTransfer={selTransfer}
                onSelTransfer={onSelTransfer}
                moqSuppliers={moqSuppliers}
                onMoqSupplier={onMoqSupplier}
              />
            );
          })()}
        </div>
      ) : (() => {
        const selectedScenario = ranked.find((s) => s.id === acceptedId);
        if (!selectedScenario) return null;
        return (
          <div className="mt-3">
            <ScenarioDetailCard
              key={selectedScenario.id}
              scenarioId={selectedScenario.id}
              cardDefs={getCardDefs(selectedScenario.id)}
              selTransfer={selTransfer}
              onSelTransfer={onSelTransfer}
              moqSuppliers={moqSuppliers}
              onMoqSupplier={onMoqSupplier}
            />
          </div>
        );
      })()}

      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px]" style={{ color: "#94a3b8" }}>
            ↓ Savings vs No Action baseline
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px]" style={{ color: "#94a3b8" }}>Reduction %:</span>
            {([
              { color: C.teal, label: "≥ 40%", meaning: "Excellent" },
              { color: "#d97706", label: "20–39%", meaning: "Moderate" },
              { color: "#dc2626", label: "< 20%", meaning: "Poor" },
            ] as { color: string; label: string; meaning: string }[]).map(({ color, label, meaning }) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                <span className="text-[10px]" style={{ color: "#94a3b8" }}>{meaning}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {compareIds.size > 0 && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: compareIds.size < 2 ? "#fff7ed" : compareIds.size >= 3 ? "#dcfce7" : C.bgBlue,
                color: compareIds.size < 2 ? "#c2410c" : compareIds.size >= 3 ? "#166534" : C.blue,
              }}
            >
              {compareIds.size < 2
                ? `${compareIds.size} of 3 selected — select at least 2 to compare`
                : `${compareIds.size} of 3 selected`}
            </span>
          )}
          {compareIds.size >= 2 && (
            <button
              type="button"
              onClick={() => setShowComparison((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: showComparison ? C.navy : C.blue,
                color: "#fff",
              }}
            >
              {showComparison ? (
                <><X size={12} />Close Comparison</>
              ) : (
                <><ChevronRight size={12} />Show Comparison</>
              )}
            </button>
          )}
        </div>
      </div>

      {showComparison && compareIds.size >= 2 && (
        <ScenarioComparisonPanel
          scenarioIds={Array.from(compareIds)}
          onClose={() => setShowComparison(false)}
          extraScenarios={[CUSTOM_SCENARIO]}
        />
      )}

      {showAcceptReasonModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => { setShowAcceptReasonModal(false); setAcceptReasonText(""); setPendingScenario(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ border: "1px solid #e2e8f0" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fffbeb" }}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                  <Star size={15} style={{ color: "#d97706" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#92400e" }}>Better option available</p>
                  <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
                    There is a best option available. Why did you choose this option instead?
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <textarea
                value={acceptReasonText}
                onChange={(e) => setAcceptReasonText(e.target.value)}
                placeholder="Enter your reason here…"
                rows={4}
                className="w-full rounded-lg text-xs resize-none outline-none focus:ring-2 px-3 py-2"
                style={{ border: "1px solid #cbd5e1", color: "#1e293b", lineHeight: 1.6 }}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAcceptReasonModal(false); setAcceptReasonText(""); setPendingScenario(null); }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!acceptReasonText.trim()}
                  onClick={() => {
                    if (pendingScenario) confirmAccept(pendingScenario);
                    setShowAcceptReasonModal(false);
                    setAcceptReasonText("");
                    setPendingScenario(null);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
                  style={{
                    backgroundColor: acceptReasonText.trim() ? C.blue : "#93c5fd",
                    color: "#fff",
                    cursor: acceptReasonText.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Submit & Accept
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </StepSection>
  );
}
const NO_ACTION_WASTE = 5541;

function bizWasteColor(wasteAfter: number, wasteBefore = NO_ACTION_WASTE): string {
  const reductionPct = wasteBefore > 0 ? ((wasteBefore - wasteAfter) / wasteBefore) * 100 : 0;
  if (reductionPct >= 40) return C.teal;
  if (reductionPct >= 20) return "#d97706";
  return "#dc2626";
}

function ScenarioDetailCard({
  scenarioId,
  cardDefs,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  scenarioId: string;
  cardDefs: { sid: string; transferId: TransferScenarioId | null }[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  // "Plan change" alert only applies to IUT route changes — MOQ supplier
  // changes don't require an STO route review, so they're tracked separately.
  const [iutChanged, setIutChanged] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSelTransfer = (id: string) => {
    if (id !== selTransfer) {
      setHasChanges(true);
      setIutChanged(true);
      setAlertDismissed(false);
    }
    onSelTransfer(id);
  };
  const handleMoqSupplier = (plantId: string, supplierId: string) => {
    if (moqSuppliers[plantId] !== supplierId) {
      setHasChanges(true);
    }
    onMoqSupplier(plantId, supplierId);
  };

  const showTransfer =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMOQTable = scenarioId === "moq";
  const transferCount = scenarioId === "iut-moq" ? 3 : 2;
  const transferOptions = IUT_TRANSFER_OPTIONS.slice(0, showTransfer ? transferCount : 0);

  // Primary = IUT card (first). Secondary = additional scenarios shown below (e.g. MOQ in combo).
  const primaryDef = cardDefs[0];
  const secondaryDefs = cardDefs.slice(1);
  const primaryScenario = SCENARIOS.find((s) => s.id === primaryDef.sid);
  const primaryTransfer = primaryDef.transferId
    ? { ...TRANSFER_OPTION_BASE, ...TRANSFER_SCENARIO_CONFIG[primaryDef.transferId] }
    : null;

  const transferRows: { label: string; render: (o: IUTOption) => React.ReactNode }[] = [
    {
      label: "Business Waste",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(o.businessWasteAfter, o.businessWasteBefore) }}>
            ₹{o.businessWasteAfter.toLocaleString("en-IN")}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
            ↓ ₹{o.reductionVsNoAction.toLocaleString("en-IN")}
          </span>
        </div>
      ),
    },
    {
      label: "Material",
      render: (o) => {
        const [type, ...rest] = o.material.split(" ");
        const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
        return (
          <span className="flex items-center justify-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
              {type}
            </span>
            <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
          </span>
        );
      },
    },
    {
      label: "Transfer Qty",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferQty.toLocaleString("en-IN")} units
        </span>
      ),
    },
    {
      label: "Lead Time",
      render: (o) => (
        <span className="text-xs tabular-nums" style={{ color: "#374151" }}>
          {o.transferLeadTime}
        </span>
      ),
    },
    {
      label: "IUT Initiation Date",
      render: (o) => (
        <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>
          {o.initiationDate}
        </span>
      ),
    },
    {
      label: "Lane",
      render: (o) =>
        o.laneAvailable === true ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
            <Check size={10} strokeWidth={2.5} />Available
          </span>
        ) : o.laneAvailable === false ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}>
            <Link2Off size={10} />Unavailable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}>
            <Clock size={10} />Not set
          </span>
        ),
    },
    {
      label: "Cost / Trip",
      render: (o) => (
        <span className="text-xs" style={{ color: "#374151" }}>₹{o.costPerTrip.toLocaleString("en-IN")}</span>
      ),
    },
    {
      label: "Prod. Stop (Source)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeFrom}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopSource}</span>
        </div>
      ),
    },
    {
      label: "Prod. Stop (Dest)",
      render: (o) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{o.routeTo}</span>
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>{o.prodStopDest}</span>
        </div>
      ),
    },
  ];

  if (!primaryScenario) return null;

  const isComboLayout = showTransfer && secondaryDefs.length > 0;

  const cardBody = (
    <>
      {/* ── Card header — full screen toggle ── */}
      <div
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
      >
        <span className="text-xs font-bold truncate" style={{ color: C.navy }}>
          {isComboLayout ? SCENARIOS.find((s) => s.id === scenarioId)?.name ?? primaryScenario.name : primaryScenario.name}
        </span>
        {isComboLayout && (
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center cursor-pointer justify-center rounded-md shrink-0 transition-colors hover:bg-slate-100"
            style={{ width: 24, height: 24, color: "#64748b", border: "1px solid #e2e8f0" }}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
      </div>

      <div style={isFullscreen ? { flex: "1 1 auto", overflow: "auto" } : undefined}>
      {isComboLayout ? (() => {
        /* ── Simple side-by-side plan comparison: Selected plan vs. next-best
           alternate, each broken down by plant with Business Waste, plant
           metrics, IUT and Procurement grouped underneath ── */
        type ComboItem = {
          key: string;
          transfer: IUTOption;
          supplierMap: Record<string, string>;
          isSelected: boolean;
        };
        type PlantMetrics = {
          base: (typeof PLANT_BREAKDOWN_BASE)[string];
          moqPlant: MOQPlantOption | null;
          supplier: MOQSupplierData | null;
          isIutSource: boolean;
          finalFgProducible: number;
          productionStopDate: string;
          planChangeRequired: boolean;
        };

        const PLANTS = ["UTR", "U535"];
        const currentTransfer =
          transferOptions.find((o) => o.id === selTransfer) ??
          transferOptions.find((o) => o.isBest) ??
          transferOptions[0];
        if (!currentTransfer) return null;

        const buildSupplierMap = (flip: boolean): Record<string, string> =>
          Object.fromEntries(
            MOQ_PLANT_OPTIONS.map((p) => {
              const currentId = moqSuppliers[p.id] ?? p.suppliers[0]?.id;
              if (!flip) return [p.id, currentId];
              const alt = p.suppliers.find((s) => s.id !== currentId) ?? p.suppliers[0];
              return [p.id, alt.id];
            }),
          );

        // Keep each option pinned to its natural column position — only the
        // "Selected" / "Alternate" badge and styling should change on click,
        // the columns themselves must not swap places.
        const combos: ComboItem[] = transferOptions.map((t) => ({
          key: t.id,
          transfer: t,
          supplierMap: buildSupplierMap(t.id !== currentTransfer.id),
          isSelected: t.id === currentTransfer.id,
        }));

        const computeForPlant = (plantCode: string, combo: ComboItem): PlantMetrics => {
          const base = PLANT_BREAKDOWN_BASE[plantCode];
          const moqPlant = MOQ_PLANT_OPTIONS.find((p) => p.plant === plantCode) ?? null;
          const roles: PlantRole[] = [];
          if (combo.transfer.routeFrom === plantCode) roles.push("source");
          if (combo.transfer.routeTo === plantCode) roles.push("destination");
          if (moqPlant) roles.push("ordering");
          const { qty, date } = computeAfterQtyAndDate(
            plantCode,
            roles,
            scenarioId,
            combo.transfer,
            moqPlant,
            combo.supplierMap,
            base.totalProductionPlanQty,
            base.prodStopDate,
          );
          const supplier = moqPlant
            ? moqPlant.suppliers.find((s) => s.id === combo.supplierMap[moqPlant.id]) ?? moqPlant.suppliers[0]
            : null;
          return {
            base,
            moqPlant,
            supplier,
            isIutSource: combo.transfer.routeFrom === plantCode,
            finalFgProducible: qty,
            productionStopDate: date,
            planChangeRequired: date !== base.prodStopDate,
          };
        };

        const dash = <span style={{ color: "#cbd5e1" }}>—</span>;

        // Visual gap between option columns so each plan reads as its own
        // tile/card instead of one continuous table.
        const GROUP_GAP = "10px solid #eef2f7";
        const groupDivider = (idx: number): React.CSSProperties =>
          idx > 0 ? { borderLeft: GROUP_GAP } : {};

        // Thick colored outline (same blue as the "Selected" header badge)
        // wrapped around the selected option's cells so the whole section —
        // not just the header — reads as clearly chosen. Uses inset box-shadow
        // instead of border so it isn't affected by the table's border-collapse.
        const SELECTED_BORDER_PX = 3;
        type BoxSide = "top" | "bottom" | "left" | "right";
        const selectedOutline = (isSelected: boolean, sides: BoxSide[]): React.CSSProperties => {
          if (!isSelected || sides.length === 0) return {};
          const shadows = sides.map((side) => {
            if (side === "top") return `inset 0 ${SELECTED_BORDER_PX}px 0 0 ${C.blue}`;
            if (side === "bottom") return `inset 0 -${SELECTED_BORDER_PX}px 0 0 ${C.blue}`;
            if (side === "left") return `inset ${SELECTED_BORDER_PX}px 0 0 0 ${C.blue}`;
            return `inset -${SELECTED_BORDER_PX}px 0 0 0 ${C.blue}`;
          });
          return { boxShadow: shadows.join(", ") };
        };
        const comboCellStyle = (ci: number, pi: number, isSelected: boolean, extraSides: BoxSide[] = []): React.CSSProperties => ({
          ...(pi === 0 ? groupDivider(ci) : {}),
          ...selectedOutline(isSelected, [pi === 0 ? "left" : "right", ...extraSides]),
        });

        const plantRows: { label: string; render: (p: PlantMetrics) => React.ReactNode }[] = [
          { label: "Production Plan Qty", render: (p) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.base.totalProductionPlan}</span> },
          { label: "Final FG Producible", render: (p) => <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(p.finalFgProducible)}</span> },
          { label: "Production Stop Date", render: (p) => <span className="text-xs font-semibold" style={{ color: "#7c3aed" }}>{p.productionStopDate}</span> },
          {
            label: "Plan Change Required",
            render: (p) =>
              p.planChangeRequired ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}><Zap size={10} />Yes</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={10} strokeWidth={2.5} />No</span>
              ),
          },
        ];

        const iutRows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[] = [
          { label: "Material Code", render: (p, c) => (p.isIutSource ? <span className="text-xs font-bold" style={{ color: C.navy }}>{c.transfer.material}</span> : dash) },
          { label: "Destination Plant", render: (p, c) => (p.isIutSource ? <span className="text-xs font-semibold" style={{ color: C.navy }}>{c.transfer.routeTo}</span> : dash) },
          { label: "Transfer Qty", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{c.transfer.transferQty.toLocaleString("en-IN")} units</span> : dash) },
          { label: "IUT Lead Time", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{c.transfer.transferLeadTime}</span> : dash) },
          { label: "IUT Initiation Date", render: (p, c) => (p.isIutSource ? <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>{c.transfer.initiationDate}</span> : dash) },
          {
            label: "Lane Availability",
            render: (p, c) =>
              !p.isIutSource ? dash : c.transfer.laneAvailable === true ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}><Check size={10} strokeWidth={2.5} />Available</span>
              ) : c.transfer.laneAvailable === false ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}><Link2Off size={10} />Unavailable</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}><Clock size={10} />Not set</span>
              ),
          },
          { label: "Cost / Trip", render: (p, c) => (p.isIutSource ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{c.transfer.costPerTrip.toLocaleString("en-IN")}</span> : dash) },
        ];

        const procurementRows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[] = [
          { label: "Material Code", render: (p) => (p.moqPlant ? <span className="text-xs font-bold" style={{ color: C.navy }}>{p.moqPlant.material}</span> : dash) },
          {
            label: "Supplier",
            render: (p, combo) => {
              if (!p.moqPlant || !p.supplier) return dash;
              if (!combo.isSelected) {
                return <span className="text-xs font-semibold" style={{ color: "#374151" }}>{p.supplier.name}</span>;
              }
              return (
                <select
                  value={p.supplier.id}
                  onChange={(e) => handleMoqSupplier(p.moqPlant!.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                  style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                >
                  {p.moqPlant.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              );
            },
          },
          { label: "Order Qty", render: (p) => (p.moqPlant ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.moqPlant.orderQty.toLocaleString("en-IN")} units</span> : dash) },
          { label: "MOQ", render: (p) => (p.supplier ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.supplier.moq.toLocaleString("en-IN")} units</span> : dash) },
          { label: "Price / Unit", render: (p) => (p.supplier ? <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{p.supplier.pricePerUnit}</span> : dash) },
          { label: "Total Order Price", render: (p) => (p.moqPlant && p.supplier ? <span className="text-xs font-bold tabular-nums" style={{ color: C.navy }}>₹{(p.moqPlant.orderQty * p.supplier.pricePerUnit).toLocaleString("en-IN")}</span> : dash) },
        ];

        const renderCardHeader = (label: React.ReactNode) => (
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap align-bottom"
                style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", width: 130 }}
              >
                {label}
              </th>
              {combos.map((combo, ci) => (
                <th
                  key={combo.key}
                  colSpan={2}
                  className="px-2 py-1.5 text-center cursor-pointer select-none"
                  style={{
                    backgroundColor: combo.isSelected ? C.navy : "#f1f5f9",
                    borderBottom: "1px solid #cbd5e1",
                    width: 220,
                    ...groupDivider(ci),
                    ...selectedOutline(combo.isSelected, ["left", "right", "top"]),
                  }}
                  onClick={() => handleSelTransfer(combo.transfer.id)}
                  title="Click to make this the selected plan"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: combo.isSelected ? "#fff" : C.navy }}>
                      Option {ci + 1}
                    </span>
                    {combo.isSelected ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.blue, color: "#fff" }}>
                        Selected
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold" style={{ color: "#64748b" }}>Alternate</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {combos.map((combo, ci) =>
                PLANTS.map((plantCode, pi) => (
                  <th
                    key={`${combo.key}-${plantCode}`}
                    className="px-2 py-1 text-center text-[10px] font-bold"
                    style={{
                      color: combo.isSelected ? "#fff" : C.navy,
                      backgroundColor: combo.isSelected ? "#234e94" : "#e2e8f0",
                      borderBottom: "2px solid #cbd5e1",
                      width: 110,
                      ...(pi === 0 ? groupDivider(ci) : {}),
                      ...selectedOutline(combo.isSelected, pi === 0 ? ["left"] : ["right"]),
                    }}
                  >
                    {plantCode}
                  </th>
                )),
              )}
            </tr>
          </thead>
        );

        const renderCardRows = (
          rows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[],
          closeBottom = false,
        ) =>
          rows.map((row, ri) => (
            <tr key={row.label} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                {row.label}
              </td>
              {combos.map((combo, ci) =>
                PLANTS.map((plantCode, pi) => (
                  <td
                    key={`${combo.key}-${plantCode}`}
                    className="px-2 py-1.5 text-center whitespace-nowrap"
                    style={comboCellStyle(ci, pi, combo.isSelected, closeBottom && ri === rows.length - 1 ? ["bottom"] : [])}
                  >
                    {row.render(computeForPlant(plantCode, combo), combo)}
                  </td>
                )),
              )}
            </tr>
          ));

        const businessWasteRow = (
          <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff7ed" }}>
            <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
              Business Waste
            </td>
            {combos.map((combo, ci) => (
              <td key={combo.key} colSpan={2} className="px-2 py-1.5 text-center whitespace-nowrap" style={{ ...groupDivider(ci), ...selectedOutline(combo.isSelected, ["left", "right"]) }}>
                <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(combo.transfer.businessWasteAfter, combo.transfer.businessWasteBefore) }}>
                  ₹{combo.transfer.businessWasteAfter.toLocaleString("en-IN")}
                </span>
                <span className="ml-1.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
                  ↓ ₹{combo.transfer.reductionVsNoAction.toLocaleString("en-IN")}
                </span>
              </td>
            ))}
          </tr>
        );

        // ── IUT + Break MOQ: group by option first — each option gets its
        // own block, with Overview / IUT / Procurement as columns inside it ──
        const renderCategoryTable = (
          title: string,
          icon: React.ReactNode,
          headerBg: string,
          bodyRows: React.ReactNode,
        ) => (
          <table className="border-collapse" style={{ width: "max-content" }}>
            <thead>
              <tr>
                <th
                  colSpan={1 + PLANTS.length}
                  className="px-2 py-1 text-center text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: C.navy, backgroundColor: headerBg, borderBottom: "1px solid #cbd5e1" }}
                >
                  <span className="inline-flex items-center justify-center gap-1">{icon}{title}</span>
                </th>
              </tr>
              <tr>
                <th
                  className="px-2 py-1 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderRight: "1px solid #e2e8f0", borderBottom: "2px solid #cbd5e1", width: 130 }}
                >
                  Detail
                </th>
                {PLANTS.map((plantCode) => (
                  <th
                    key={plantCode}
                    className="px-2 py-1 text-center text-[10px] font-bold"
                    style={{ color: C.navy, backgroundColor: "#e2e8f0", borderBottom: "2px solid #cbd5e1", width: 110 }}
                  >
                    {plantCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{bodyRows}</tbody>
          </table>
        );

        const renderPlantRowsForCombo = (
          rows: { label: string; render: (p: PlantMetrics, combo: ComboItem) => React.ReactNode }[],
          combo: ComboItem,
        ) =>
          rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
              <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                {row.label}
              </td>
              {PLANTS.map((plantCode) => (
                <td key={plantCode} className="px-2 py-1.5 text-center whitespace-nowrap">
                  {row.render(computeForPlant(plantCode, combo), combo)}
                </td>
              ))}
            </tr>
          ));

        const renderOverviewTable = (combo: ComboItem) =>
          renderCategoryTable(
            "Overview",
            <Box size={10} />,
            "#fff7ed",
            <>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff7ed" }}>
                <td className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0" }}>
                  Business Waste
                </td>
                <td colSpan={PLANTS.length} className="px-2 py-1.5 text-center whitespace-nowrap">
                  <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(combo.transfer.businessWasteAfter, combo.transfer.businessWasteBefore) }}>
                    ₹{combo.transfer.businessWasteAfter.toLocaleString("en-IN")}
                  </span>
                  <span className="ml-1.5 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>
                    ↓ ₹{combo.transfer.reductionVsNoAction.toLocaleString("en-IN")}
                  </span>
                </td>
              </tr>
              {renderPlantRowsForCombo(plantRows, combo)}
            </>,
          );

        const optionSections = combos.map((combo, ci) => (
          <div
            key={combo.key}
            className="rounded-xl overflow-hidden bg-white"
            style={{
              width: "fit-content",
              border: combo.isSelected ? `3px solid ${C.navy}` : "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
              marginTop: ci > 0 ? 16 : 0,
            }}
          >
            <div
              className="px-3 py-2 flex items-center gap-2 cursor-pointer select-none"
              style={{ backgroundColor: combo.isSelected ? C.navy : "#f1f5f9" }}
              onClick={() => handleSelTransfer(combo.transfer.id)}
              title="Click to make this the selected plan"
            >
              <span className="text-sm font-bold" style={{ color: combo.isSelected ? "#fff" : C.navy }}>
                Option {ci + 1}
              </span>
              {combo.isSelected ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold" style={{ backgroundColor: C.blue, color: "#fff" }}>
                  Selected
                </span>
              ) : (
                <span className="text-[9px] font-semibold" style={{ color: "#64748b" }}>Alternate</span>
              )}
            </div>
            <div className="flex flex-nowrap" style={{ overflowX: "auto" }}>
              {renderOverviewTable(combo)}
              {renderCategoryTable("IUT", <ArrowLeftRight size={10} />, "#f0fdfa", renderPlantRowsForCombo(iutRows, combo))}
              {renderCategoryTable("Procurement", <ShoppingCart size={10} />, "#f0fdfa", renderPlantRowsForCombo(procurementRows, combo))}
            </div>
          </div>
        ));
        const useOptionGrouping = scenarioId === "iut-moq-break";

        return (
          <div style={{ overflow: "auto", backgroundColor: "#ffffff" }}>
            <div
              className="px-3 py-1.5 flex items-center gap-1.5"
              style={{ borderBottom: iutChanged && !alertDismissed ? "none" : "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                Plan Comparison
              </span>
              <span className="ml-1 text-xs" style={{ color: "#475569" }}>
                · click a plan's header to select it · change supplier to update procurement data
              </span>
            </div>
            {iutChanged && !alertDismissed && (
              <div
                className="px-3 py-2 flex items-center justify-between gap-2"
                style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", borderTop: "1px solid #fde68a" }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>
                    This option needs a plan change
                  </span>
                  <span className="text-[10px]" style={{ color: "#b45309" }}>
                    — review the selected route before raising STO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertDismissed(true)}
                  className="shrink-0"
                  style={{ color: "#d97706" }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {useOptionGrouping ? (
              <div className="p-4">
                {optionSections}
              </div>
            ) : (
              <div className="flex justify-start p-4">
              <div
                className="rounded-xl overflow-hidden bg-white"
                style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
              >
              <table className="border-collapse" style={{ width: "max-content" }}>
                {renderCardHeader("Detail")}
                <tbody>
                  {businessWasteRow}
                  {renderCardRows(plantRows)}

                  {/* ── IUT section ── */}
                  <tr>
                    <td colSpan={1 + combos.length * 2} className="px-2 py-1" style={{ backgroundColor: "#f0fdfa" }}>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: C.navy }}>
                        <ArrowLeftRight size={9} />IUT
                      </span>
                    </td>
                  </tr>
                  {renderCardRows(iutRows)}

                  {/* ── Procurement section ── */}
                  <tr>
                    <td colSpan={1 + combos.length * 2} className="px-2 py-1" style={{ backgroundColor: "#f0fdfa" }}>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: C.teal }}>
                        <ShoppingCart size={9} />Procurement
                      </span>
                    </td>
                  </tr>
                  {renderCardRows(procurementRows, true)}
                </tbody>
              </table>
              </div>
              </div>
            )}
          </div>
        );
      })() : (
        <div style={{ overflow: "auto" }}>
          {/* MOQ procurement table (standalone moq scenario) */}
          {showMOQTable && (
            <div>
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  Procurement Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>· change supplier to update data</span>
              </div>
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#94a3b8", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #e2e8f0", minWidth: 100 }}
                    >
                      Metric
                    </th>
                    {MOQ_PLANT_OPTIONS.map((plant) => (
                      <th
                        key={plant.id}
                        className="px-3 py-2 text-center"
                        style={{ backgroundColor: plant.isBest ? "#dbeafe" : "#f1f5f9", borderBottom: `2px solid ${plant.isBest ? C.blue : "#cbd5e1"}`, minWidth: 150 }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                            {plant.isBest && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                <Star size={6} fill="currentColor" />Best
                              </span>
                            )}
                          </div>
                          <label className="flex items-center gap-1 w-full">
                            <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>Supplier</span>
                            <select
                              value={moqSuppliers[plant.id]}
                              onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] rounded px-1.5 py-0.5 w-full cursor-pointer"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                            >
                              {plant.suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { label: "Business Waste",   render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(s.bizWaste) }}>₹{s.bizWaste.toLocaleString("en-IN")}</span> },
                      { label: "Material",        render: (p: MOQPlantOption, _s: MOQSupplierData) => { const [type, ...rest] = p.material.split(" "); const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" }; return <span className="flex items-center justify-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{type}</span><span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span></span>; } },
                      { label: "Order Qty",        render: (p: MOQPlantOption, _s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.orderQty.toLocaleString("en-IN")} units</span> },
                      { label: "MOQ",              render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold tabular-nums" style={{ color: "#374151" }}>{s.moq.toLocaleString("en-IN")} units</span> },
                      { label: "Price / Unit",     render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{s.pricePerUnit}</span> },
                      { label: "Production Date",  render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold" style={{ color: "#374151" }}>{s.productionDate}</span> },
                    ] as { label: string; render: (p: MOQPlantOption, s: MOQSupplierData) => React.ReactNode }[]
                  ).map((row, i) => (
                    <tr key={row.label} style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                        {row.label}
                      </td>
                      {MOQ_PLANT_OPTIONS.map((plant) => {
                        const selSup = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                        return (
                          <td key={plant.id} className="px-3 py-1.5 text-center">
                            {row.render(plant, selSup)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IUT transfer options table */}
          {showTransfer && transferOptions.length > 0 && (
            <div>
              {/* Sub-header */}
              <div
                className="px-3 py-1.5 flex items-center gap-1.5"
                style={{ borderBottom: iutChanged && !alertDismissed ? "none" : "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}
              >
                <ArrowLeftRight size={9} style={{ color: C.blue }} />
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.blue }}>
                  IUT Options
                </span>
                <span className="ml-1 text-[9px]" style={{ color: "#94a3b8" }}>
                  · click a column to select
                </span>
              </div>
              {iutChanged && !alertDismissed && (
                <div
                  className="px-3 py-2 flex items-center justify-between gap-2"
                  style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", borderTop: "1px solid #fde68a" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#92400e" }}>
                      This option needs a plan change
                    </span>
                    <span className="text-[10px]" style={{ color: "#b45309" }}>
                      — review the selected route before raising STO
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertDismissed(true)}
                    className="shrink-0"
                    style={{ color: "#d97706" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <table className="border-collapse" style={{ width: "100%", minWidth: "max-content" }}>
                <thead>
                  <tr style={{ height: 64 }}>
                    <th
                      className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{
                        color: "#94a3b8",
                        backgroundColor: "#f1f5f9",
                        borderBottom: "2px solid #cbd5e1",
                        borderRight: "1px solid #e2e8f0",
                        minWidth: 100,
                      }}
                    >
                      Metric
                    </th>
                    {transferOptions.map((o) => {
                      const isSel = selTransfer === o.id;
                      return (
                        <th
                          key={o.id}
                          className="px-3 py-2 text-center cursor-pointer select-none"
                          style={{
                            backgroundColor: isSel ? C.navy : o.isBest ? "#dbeafe" : "#f1f5f9",
                            borderBottom: `2px solid ${isSel ? C.blue : o.isBest ? C.blue : "#cbd5e1"}`,
                            minWidth: 120,
                          }}
                          onClick={() => handleSelTransfer(o.id)}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-bold leading-tight" style={{ color: isSel ? "#fff" : C.navy }}>
                              {o.routeFrom}
                              <span className="mx-1 opacity-60" style={{ color: isSel ? "#fff" : C.blue }}>→</span>
                              {o.routeTo}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px]" style={{ color: isSel ? "rgba(255,255,255,0.6)" : "#64748b" }}>{o.label}</span>
                              {o.isBest && !isSel && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: C.green, color: "#fff" }}>
                                  <Star size={6} fill="currentColor" />Best
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {transferRows.map((row, i) => (
                    <tr key={row.label} style={{ height: 44, backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                      <td
                        className="px-3 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#94a3b8", borderRight: "1px solid #e2e8f0", backgroundColor: "#ffffff", verticalAlign: "middle" }}
                      >
                        {row.label}
                      </td>
                      {transferOptions.map((o) => {
                        const isSel = selTransfer === o.id;
                        return (
                          <td
                            key={o.id}
                            className="px-3 text-center cursor-pointer"
                            style={{
                              verticalAlign: "middle",
                              backgroundColor: isSel ? "rgba(21,101,192,0.05)" : undefined,
                              borderLeft: isSel ? `2px solid ${C.blue}` : undefined,
                              borderRight: isSel ? `2px solid ${C.blue}` : undefined,
                            }}
                            onClick={() => handleSelTransfer(o.id)}
                          >
                            {row.render(o)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>

      {hasChanges && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderTop: "2px solid #bfdbfe", backgroundColor: "#eff6ff" }}
        >
          <p className="text-xs" style={{ color: C.blue }}>
            <span className="font-semibold">Unsaved changes</span>
            {" — "}review your selection before applying.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
                setIutChanged(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
                setIutChanged(false);
                toast.success("Changes applied", {
                  description: "Scenario updated with your selection.",
                  duration: 3000,
                });
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: C.blue, color: "#fff" }}
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return createPortal(
      <div
        className="fixed inset-0 flex flex-col bg-white"
        style={{ zIndex: 100 }}
      >
        {cardBody}
      </div>,
      document.body
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ width: isComboLayout ? "100%" : "max-content", minWidth: isComboLayout ? undefined : "50%", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {cardBody}
    </div>
  );
}
