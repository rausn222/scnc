import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Factory,
  Info,
  Link2Off,
  ShoppingCart,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import type { IUTOption, MOQPlantOption, PlantRole } from "../../sciDetails/types";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS_BREAK, PLANT_BREAKDOWN_BASE, PM_BADGE, RM_BADGE, SCENARIOS } from "../../sciDetails/constants";
import { computeAfterQtyAndDate, formatIndianNumber } from "../../sciDetails/utils";
import { ReportBadge } from "../../sciDetails/step3report/ReportPrimitives";

function materialBadge(material: string) {
  const [type, ...rest] = material.split(" ");
  const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.navy }}>{rest.join(" ")}</span>
    </span>
  );
}

function laneBadge(available: boolean | null) {
  if (available === true) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: C.green }}>
        <Check size={10} strokeWidth={2.5} />Lane available
      </span>
    );
  }
  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: "#ea580c" }}>
        <Link2Off size={10} />Lane unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap" style={{ color: "#d97706" }}>
      <Clock size={10} />Lane not set
    </span>
  );
}

const editInputStyle = { border: `1px solid ${C.blue}`, color: C.navy, outline: "none" } as const;

type PlantOutcome = { plantCode: string; finalFgProducible: number; productionStopDate: string; planChangeRequired: boolean };

type OptionSummary = {
  option: IUTOption;
  effOption: IUTOption;
  effMoqPlantData: MOQPlantOption[];
  plantOutcomes: PlantOutcome[];
  totalFg: number;
  totalCost: number;
  belowMoqCount: number;
  planChangeCount: number;
};

const TABLE_GRID_COLS = "minmax(150px,1.6fr) 110px 110px 140px 130px 130px 110px 110px";

/**
 * Purpose-built "IUT + Break MOQ" comparison, redesigned to match the Project Details page's
 * table + recommendation-panel layout: both routing options sit in one clean summary table
 * (row = option) with a right-side panel surfacing the recommendation and any blockers at a
 * glance. Full detail (IUT flow / plant impact / procurement, still editable via Customise)
 * opens in its own right-side drawer via "View Details" rather than expanding the row inline.
 */
export function ScenarioDetailCardBreakMoq({
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
  customScenarioCount,
  maxCustomScenarios,
  onAddCustomScenario,
  onCloseDrawer,
}: {
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  /** How many user-created custom scenarios already exist, and the cap — gates the Customise → Save flow. */
  customScenarioCount: number;
  maxCustomScenarios: number;
  /** Saves the currently-edited option's totals as a new "Custom Scenario N" row in the comparison table. */
  onAddCustomScenario: (businessWaste: string, fgDaysCover: string) => void;
  /** Closes the whole More Details drawer — called once a custom scenario has been saved. */
  onCloseDrawer: () => void;
}) {
  const options = IUT_TRANSFER_OPTIONS.slice(0, 2);

  // Which option's full-detail drawer is open, and (separately) which one is in edit mode —
  // options are shared module-level data, so edits are kept as per-id overrides rather than
  // mutating them.
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);
  const [customisingId, setCustomisingId] = useState<string | null>(null);
  const [optionOverrides, setOptionOverrides] = useState<
    Record<string, Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>>
  >({});
  const [moqOrderQtyOverrides, setMoqOrderQtyOverrides] = useState<Record<string, number>>({});

  const updateOptionOverride = (
    id: string,
    patch: Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>,
  ) => {
    setOptionOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };
  const updateMoqOrderQty = (plantId: string, orderQty: number) => {
    setMoqOrderQtyOverrides((prev) => ({ ...prev, [plantId]: orderQty }));
  };

  const computeOutcome = (plantCode: string, transfer: IUTOption, moqPlant: MOQPlantOption | null): PlantOutcome | null => {
    const base = PLANT_BREAKDOWN_BASE[plantCode];
    if (!base) return null;
    const roles: PlantRole[] = [];
    if (transfer.routeFrom === plantCode) roles.push("source");
    if (transfer.routeTo === plantCode) roles.push("destination");
    if (moqPlant?.plant === plantCode) roles.push("ordering");
    const { qty, date } = computeAfterQtyAndDate(
      plantCode,
      roles,
      "iut-moq-break",
      transfer,
      moqPlant,
      moqSuppliers,
      base.totalProductionPlanQty,
      base.prodStopDate,
    );
    return { plantCode, finalFgProducible: qty, productionStopDate: date, planChangeRequired: date !== base.prodStopDate };
  };

  const summaries: OptionSummary[] = options.map((option) => {
    const effOption: IUTOption = { ...option, ...optionOverrides[option.id] };
    const effMoqPlantData = MOQ_PLANT_OPTIONS_BREAK.map((p) => ({
      ...p,
      orderQty: moqOrderQtyOverrides[p.id] ?? p.orderQty,
    }));
    const plantOutcomes = Object.keys(PLANT_BREAKDOWN_BASE)
      .map((code) => computeOutcome(code, effOption, effMoqPlantData.find((p) => p.plant === code) ?? null))
      .filter((o): o is PlantOutcome => o !== null);
    const totalFg = plantOutcomes.reduce((sum, o) => sum + o.finalFgProducible, 0);
    const procurementCost = effMoqPlantData.reduce((sum, plant) => {
      const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
      return sum + plant.orderQty * supplier.pricePerUnit;
    }, 0);
    const totalCost = effOption.costPerTrip + procurementCost;
    const belowMoqCount = effMoqPlantData.filter((p) => p.moqBroken != null).length;
    const planChangeCount = plantOutcomes.filter((o) => o.planChangeRequired).length;

    return { option, effOption, effMoqPlantData, plantOutcomes, totalFg, totalCost, belowMoqCount, planChangeCount };
  });

  const recommended = summaries.find((s) => s.option.isBest) ?? summaries[0];
  const alternative = summaries.find((s) => s.option.id !== recommended.option.id) ?? null;
  const detailSummary = summaries.find((s) => s.option.id === detailDrawerId) ?? null;
  const atCustomScenarioLimit = customScenarioCount >= maxCustomScenarios;

  // Clicking "Save as Custom Scenario" (the Customise toggle's other state) persists the
  // currently-edited option's totals as a brand-new custom scenario — the option itself, and
  // this recommendation, are left untouched — then closes both drawers so the new row is visible.
  const handleToggleCustomise = (id: string) => {
    if (customisingId !== id) {
      setCustomisingId(id);
      return;
    }
    const summary = summaries.find((s) => s.option.id === id);
    if (summary && !atCustomScenarioLimit) {
      const baseCoverDays = parseInt(SCENARIOS.find((s) => s.id === "iut-moq-break")?.fgDaysCover ?? "26", 10) || 26;
      onAddCustomScenario(String(summary.totalCost), String(baseCoverDays));
    }
    setCustomisingId(null);
    setOptionOverrides({});
    setMoqOrderQtyOverrides({});
    setDetailDrawerId(null);
    onCloseDrawer();
  };

  return (
    <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
      <OptionsTable
        summaries={summaries}
        selTransfer={selTransfer}
        onSelTransfer={onSelTransfer}
        onViewDetails={setDetailDrawerId}
      />
      <RecommendationPanel
        recommended={recommended}
        alternative={alternative}
        selTransfer={selTransfer}
        onSelTransfer={onSelTransfer}
      />

      {detailSummary && (
        <OptionDetailDrawer
          summary={detailSummary}
          isSelected={selTransfer === detailSummary.option.id}
          isCustomising={customisingId === detailSummary.option.id}
          onToggleCustomise={() => handleToggleCustomise(detailSummary.option.id)}
          atCustomScenarioLimit={atCustomScenarioLimit}
          maxCustomScenarios={maxCustomScenarios}
          moqSuppliers={moqSuppliers}
          onMoqSupplier={onMoqSupplier}
          onUpdateOptionOverride={updateOptionOverride}
          onUpdateMoqOrderQty={updateMoqOrderQty}
          onClose={() => setDetailDrawerId(null)}
        />
      )}
    </div>
  );
}

// ─── Left: options summary table ───────────────────────────────────────────────

function OptionsTable({
  summaries,
  selTransfer,
  onSelTransfer,
  onViewDetails,
}: {
  summaries: OptionSummary[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0" }}>
      <div
        className="grid items-center px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: TABLE_GRID_COLS, backgroundColor: C.bgBlue, color: C.navy }}
      >
        <span>Option</span>
        <span>Total Cost</span>
        <span>Total FG</span>
        <span>Plan Changes</span>
        <span>Procurement</span>
        <span>Lane</span>
        <span>Action</span>
        <span>Details</span>
      </div>

      {summaries.map(({ option, totalFg, totalCost, belowMoqCount, planChangeCount, plantOutcomes }) => {
        const isSelected = selTransfer === option.id;

        return (
          <div
            key={option.id}
            className="grid items-center w-full text-left px-3 py-3"
            style={{ gridTemplateColumns: TABLE_GRID_COLS, backgroundColor: isSelected ? C.bgBlue : "#fff", borderTop: "1px solid #e2e8f0" }}
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold" style={{ color: C.navy }}>{option.label}</span>
                {option.isBest && (
                  <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>
                )}
                {isSelected && <ReportBadge tone="info"><Check size={9} strokeWidth={2.5} />Selected</ReportBadge>}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                {option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo}
              </div>
            </div>

            <span className="text-xs font-bold tabular-nums" style={{ color: C.blue }}>
              ₹{formatIndianNumber(totalCost)}
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "#166534" }}>
              {formatIndianNumber(totalFg)} EA
            </span>

            <span>
              {planChangeCount > 0 ? (
                <ReportBadge tone="warning">{planChangeCount} of {plantOutcomes.length}</ReportBadge>
              ) : (
                <ReportBadge tone="success">None</ReportBadge>
              )}
            </span>
            <span>
              {belowMoqCount > 0 ? (
                <ReportBadge tone="warning">{belowMoqCount} below MOQ</ReportBadge>
              ) : (
                <ReportBadge tone="success">Within MOQ</ReportBadge>
              )}
            </span>
            <span>{laneBadge(option.laneAvailable)}</span>

            <button
              type="button"
              disabled={isSelected}
              onClick={() => onSelTransfer(option.id)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity justify-self-start"
              style={{
                backgroundColor: isSelected ? "#dcfce7" : C.blue,
                color: isSelected ? "#166534" : "#fff",
                cursor: isSelected ? "default" : "pointer",
              }}
            >
              {isSelected ? "Selected" : "Select"}
            </button>

            <button
              type="button"
              onClick={() => onViewDetails(option.id)}
              title={`View full details for ${option.label}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer justify-self-start"
              style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }}
            >
              <Eye size={11} />
              View
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SubTableHeading({ label, icon, suffix }: { label: string; icon?: React.ReactNode; suffix?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</span>
      {suffix && <span className="text-[10px]" style={{ color: "#cbd5e1" }}>· {suffix}</span>}
    </div>
  );
}

function FieldCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>{label}</span>
      {children}
    </div>
  );
}

// ─── Right-side drawer: one option's full detail (was previously an inline row expansion) ──────

function OptionDetailDrawer({
  summary,
  isSelected,
  isCustomising,
  onToggleCustomise,
  atCustomScenarioLimit,
  maxCustomScenarios,
  moqSuppliers,
  onMoqSupplier,
  onUpdateOptionOverride,
  onUpdateMoqOrderQty,
  onClose,
}: {
  summary: OptionSummary;
  isSelected: boolean;
  isCustomising: boolean;
  onToggleCustomise: () => void;
  atCustomScenarioLimit: boolean;
  maxCustomScenarios: number;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  onUpdateOptionOverride: (id: string, patch: Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>) => void;
  onUpdateMoqOrderQty: (plantId: string, orderQty: number) => void;
  onClose: () => void;
}) {
  const { option, effOption, effMoqPlantData, plantOutcomes } = summary;

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex justify-end"
      style={{ backgroundColor: "rgba(0,48,135,0.18)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="h-full flex flex-col bg-white"
        style={{ width: "min(92vw, 640px)", boxShadow: "-20px 0 60px rgba(0,48,135,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 flex items-start justify-between gap-3 shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold" style={{ color: C.navy }}>{option.label}</span>
              {option.isBest && (
                <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>
              )}
              {isSelected && <ReportBadge tone="info"><Check size={9} strokeWidth={2.5} />Selected</ReportBadge>}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo} · ₹{formatIndianNumber(summary.totalCost)} · {formatIndianNumber(summary.totalFg)} EA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Scenario Summary — the two headline figures, restated as tiles rather than just
              the compact header subtitle, so they read clearly alongside the rest of the detail. */}
          <div className="px-4 pt-3 pb-1">
            <SubTableHeading label="Scenario Summary" icon={<Factory size={11} style={{ color: C.blue }} />} />
            <div className="grid grid-cols-2 gap-2">
              <ImpactStat label="Total Cost" value={`₹${formatIndianNumber(summary.totalCost)}`} />
              <ImpactStat label="Total FG Producible" value={`${formatIndianNumber(summary.totalFg)} EA`} />
            </div>
          </div>

          <div className="px-4 pt-2 flex items-center justify-between gap-2 flex-wrap">
            {isCustomising ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <Info size={12} style={{ color: "#c2410c" }} className="shrink-0" />
                <span className="text-[11px]" style={{ color: "#9a3412" }}>
                  Editing these values won't change this recommendation — saving will create a new custom scenario.
                </span>
              </div>
            ) : <span />}
            <button
              type="button"
              disabled={!isCustomising && atCustomScenarioLimit}
              onClick={onToggleCustomise}
              title={
                !isCustomising && atCustomScenarioLimit
                  ? `Limit of ${maxCustomScenarios} custom scenarios reached`
                  : isCustomising
                    ? "Save these edited figures as a new custom scenario"
                    : "Edit this option's figures"
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors shrink-0"
              style={
                isCustomising
                  ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}`, cursor: "pointer" }
                  : atCustomScenarioLimit
                    ? { backgroundColor: "#f8fafc", color: "#cbd5e1", border: "1px solid #f1f5f9", cursor: "not-allowed" }
                    : { backgroundColor: "#fff", color: C.navy, border: "1px solid #cbd5e1", cursor: "pointer" }
              }
            >
              {isCustomising && <Sparkles size={12} />}
              {isCustomising ? "Save as Custom Scenario" : "Customise"}
            </button>
          </div>

          {/* IUT Flow — single-row detail table, editable under Customise. */}
          <div className="px-4 pt-2 pb-3">
            <SubTableHeading label="IUT Flow" />
            <div className="grid items-center px-3 py-2 gap-y-2" style={{ gridTemplateColumns: "1fr 1fr", border: `1px solid ${isCustomising ? C.blue : "#e2e8f0"}`, borderRadius: 8, backgroundColor: "#fff" }}>
              <div className="flex items-center gap-2 col-span-2">
                {materialBadge(option.material)}
              </div>
              <FieldCell label="Qty">
                {isCustomising ? (
                  <input
                    type="number"
                    min={0}
                    value={effOption.transferQty}
                    onChange={(e) => onUpdateOptionOverride(option.id, { transferQty: Number(e.target.value) || 0 })}
                    className="w-full text-center text-[11px] font-semibold tabular-nums rounded px-1 py-0.5"
                    style={editInputStyle}
                  />
                ) : (
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.navy }}>{effOption.transferQty.toLocaleString("en-IN")} EA</span>
                )}
              </FieldCell>
              <FieldCell label="Lead time">
                {isCustomising ? (
                  <input
                    type="text"
                    value={effOption.transferLeadTime}
                    onChange={(e) => onUpdateOptionOverride(option.id, { transferLeadTime: e.target.value })}
                    className="w-full text-center text-[11px] rounded px-1 py-0.5"
                    style={editInputStyle}
                  />
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{effOption.transferLeadTime}</span>
                )}
              </FieldCell>
              <FieldCell label="Initiation">
                {isCustomising ? (
                  <input
                    type="text"
                    value={effOption.initiationDate}
                    onChange={(e) => onUpdateOptionOverride(option.id, { initiationDate: e.target.value })}
                    className="w-full text-center text-[11px] font-semibold rounded px-1 py-0.5"
                    style={editInputStyle}
                  />
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: C.navy }}>{effOption.initiationDate}</span>
                )}
              </FieldCell>
              <FieldCell label="Cost/trip">
                {isCustomising ? (
                  <input
                    type="number"
                    min={0}
                    value={effOption.costPerTrip}
                    onChange={(e) => onUpdateOptionOverride(option.id, { costPerTrip: Number(e.target.value) || 0 })}
                    className="w-full text-center text-[11px] font-semibold rounded px-1 py-0.5"
                    style={editInputStyle}
                  />
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: C.navy }}>₹{effOption.costPerTrip}</span>
                )}
              </FieldCell>
              <div className="col-span-2 flex justify-end">{laneBadge(option.laneAvailable)}</div>
            </div>
          </div>

          {/* Plant Impact — one row per plant. */}
          <div className="px-4 pb-3">
            <SubTableHeading label="Plant Impact" />
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="grid items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "80px 1fr 1fr 1.3fr", backgroundColor: "#f8fafc", color: "#94a3b8" }}>
                <span>Plant</span>
                <span>FG Producible</span>
                <span>Stop Date</span>
                <span>Status</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
                {plantOutcomes.map((o) => (
                  <div key={o.plantCode} className="grid items-center px-3 py-2" style={{ gridTemplateColumns: "80px 1fr 1fr 1.3fr", backgroundColor: "#fff" }}>
                    <span className="text-[11px] font-bold" style={{ color: C.navy }}>{o.plantCode}</span>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color: "#374151" }}>{formatIndianNumber(o.finalFgProducible)} EA</span>
                    <span className="text-[11px] font-semibold" style={{ color: "#374151" }}>{o.productionStopDate}</span>
                    <span>
                      {o.planChangeRequired ? (
                        <ReportBadge tone="warning">Plan change needed</ReportBadge>
                      ) : (
                        <ReportBadge tone="success">No plan change</ReportBadge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Procurement — one row per broken-MOQ order; supplier + qty editable under Customise. */}
          <div className="px-4 pb-4">
            <SubTableHeading label="Procurement" icon={<ShoppingCart size={11} style={{ color: C.blue }} />} suffix={`${effMoqPlantData.length} orders`} />
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
              <div className="grid items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ gridTemplateColumns: "80px 1fr 1.2fr 1fr", backgroundColor: "#f8fafc", color: "#94a3b8" }}>
                <span>Plant</span>
                <span>Material</span>
                <span>Supplier</span>
                <span className="text-right">Order / Est. Cost</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
                {effMoqPlantData.map((plant) => {
                  const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                  return (
                    <div key={plant.id} className="grid items-center px-3 py-2" style={{ gridTemplateColumns: "80px 1fr 1.2fr 1fr" }}>
                      <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                      <span>{materialBadge(plant.material)}</span>
                      {isCustomising ? (
                        <select
                          value={supplier.id}
                          onChange={(e) => onMoqSupplier(plant.id, e.target.value)}
                          title={`Choose supplier for ${plant.plant}`}
                          className="text-[11px] rounded px-1.5 py-1 cursor-pointer"
                          style={{ ...editInputStyle, backgroundColor: "#fff", width: "100%", maxWidth: 150 }}
                        >
                          {plant.suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] font-semibold truncate" title={supplier.name} style={{ color: C.blue, maxWidth: 150 }}>
                          {supplier.name}
                        </span>
                      )}
                      <div className="text-right text-[10px]" style={{ color: "#374151" }}>
                        <div className="flex items-center flex-wrap gap-1 justify-end">
                          {isCustomising ? (
                            <input
                              type="number"
                              min={0}
                              value={plant.orderQty}
                              onChange={(e) => onUpdateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                              className="w-16 text-center text-[10px] font-semibold tabular-nums rounded px-1 py-0.5"
                              style={editInputStyle}
                            />
                          ) : (
                            <span className="tabular-nums whitespace-nowrap">{formatIndianNumber(plant.orderQty)} units</span>
                          )}
                          {plant.moqBroken != null && <ReportBadge tone="warning">Below MOQ</ReportBadge>}
                        </div>
                        <div className="font-bold tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                          Est. ₹{formatIndianNumber(plant.orderQty * supplier.pricePerUnit)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

// ─── Right: recommendation panel ───────────────────────────────────────────────

/** One concise line combining the cost/FG tradeoff vs the other option with a blocker count —
    replaces the old multi-card Diagnosis list with a single meaningful sentence. */
function buildInsightLine(target: OptionSummary, other: OptionSummary | null): string {
  let lead = "";
  if (other) {
    const costDelta = other.totalCost - target.totalCost;
    const fgDelta = target.totalFg - other.totalFg;
    if (costDelta > 0) lead = `Saves ₹${formatIndianNumber(costDelta)} vs ${other.option.label}. `;
    else if (costDelta < 0) lead = `₹${formatIndianNumber(-costDelta)} costlier than ${other.option.label}. `;
    else if (fgDelta > 0) lead = `Produces ${formatIndianNumber(fgDelta)} EA more than ${other.option.label}. `;
    else if (fgDelta < 0) lead = `Produces ${formatIndianNumber(-fgDelta)} EA less than ${other.option.label}. `;
  }
  const blockerCount = target.belowMoqCount + target.planChangeCount + (target.option.laneAvailable === false ? 1 : 0);
  const blockerLine = blockerCount === 0 ? "No blockers." : `${blockerCount} item${blockerCount > 1 ? "s" : ""} need attention.`;
  return `${lead}${blockerLine}`;
}

function RecommendationPanel({
  recommended,
  alternative,
  selTransfer,
  onSelTransfer,
}: {
  recommended: OptionSummary;
  alternative: OptionSummary | null;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
}) {
  const selected = alternative && selTransfer === alternative.option.id ? alternative : recommended;
  const other = selected.option.id === recommended.option.id ? alternative : recommended;
  const isRecommendedSelected = selected.option.id === recommended.option.id;
  const selectedHasBlockers = selected.belowMoqCount > 0 || selected.planChangeCount > 0 || selected.option.laneAvailable === false;
  const insightLine = buildInsightLine(isRecommendedSelected ? selected : recommended, other);

  return (
    <div className="rounded-xl bg-white overflow-hidden flex flex-col" style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <Zap size={14} style={{ color: C.blue }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>Recommendation</span>
        <span className="w-1.5 h-1.5 rounded-full ml-auto" style={{ backgroundColor: selectedHasBlockers ? "#d97706" : C.green }} />
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-sm font-bold" style={{ color: C.navy }}>IUT + Break MOQ</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
            {selected.option.routeFrom} → {selected.option.routeTo}
          </p>
        </div>

        {/* Scenario Summary — the selected option's own headline figures, shown first since
            recommendation is secondary to what's actually been picked. */}
        <div>
          <SectionLabel>Scenario Summary</SectionLabel>
          <div className="rounded-lg p-3" style={{ border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              <span className="text-xs font-bold" style={{ color: C.navy }}>{selected.option.label}</span>
              {selected.option.isBest && (
                <ReportBadge tone="success"><Star size={9} fill="currentColor" />Recommended</ReportBadge>
              )}
              <ReportBadge tone="info"><Check size={9} strokeWidth={2.5} />Selected</ReportBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ImpactStat label="Total Cost" value={`₹${formatIndianNumber(selected.totalCost)}`} />
              <ImpactStat label="Total FG Producible" value={`${formatIndianNumber(selected.totalFg)} EA`} />
            </div>
          </div>
        </div>

        {/* Recommendation follows the selected summary — one concrete sentence (via
            buildInsightLine) instead of a checklist of separate diagnosis cards. */}
        <div>
          <SectionLabel>Recommendation</SectionLabel>
          {isRecommendedSelected ? (
            <div className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <CheckCircle2 size={22} style={{ color: C.green }} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: "#166534" }}>You've selected the recommended option</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#15803d" }}>{insightLine}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-4 flex flex-col gap-3" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="flex items-center gap-3">
                <Star size={22} style={{ color: "#d97706" }} className="shrink-0" fill="currentColor" />
                <div className="min-w-0">
                  <p className="text-xs font-bold" style={{ color: "#92400e" }}>{recommended.option.label} recommended instead</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#a16207" }}>{insightLine}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelTransfer(recommended.option.id)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: C.navy }}
              >
                <Sparkles size={13} />
                Select {recommended.option.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#94a3b8" }}>
      {children}
    </p>
  );
}

function ImpactStat({ label, value, valueColor = C.navy }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
      <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-xs font-bold mt-0.5 truncate" style={{ color: valueColor }}>{value}</p>
    </div>
  );
}
