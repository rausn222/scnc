import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  Calendar,
  Check,
  Clock,
  Factory,
  Link2Off,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Star,
} from "lucide-react";
import type { IUTOption, MOQPlantOption, PlantRole } from "../types";
import {
  C,
  SCENARIOS,
  IUT_TRANSFER_OPTIONS,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  PLANT_BREAKDOWN_BASE,
  RM_BADGE,
  PM_BADGE,
} from "../constants";
import { computeAfterQtyAndDate, formatIndianNumber } from "../utils";
import { LabelValue, ReportBadge, ReportSectionHeading } from "./ReportPrimitives";

const PLANTS = ["UTR", "U535"];

const SCENARIO_NARRATIVE: Record<string, string> = {
  "no-action": "No mitigating action is taken — production stops once on-hand stock and open purchase orders are exhausted.",
  iut: "Move surplus stock between plants to extend the production run. No new purchase order is placed.",
  moq: "Place a fresh purchase order to top up materials at the standard minimum order quantity. No inter-unit stock transfer is involved.",
  "iut-moq": "Combine an inter-unit stock transfer with a standard procurement order — the system's top overall recommendation for closing the supply gap.",
  "iut-moq-break": "Combine an inter-unit stock transfer with a smaller, split purchase order below the standard MOQ — unlocks extra production days without over-ordering.",
};

function materialBadge(material: string) {
  const [type, ...rest] = material.split(" ");
  const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
        {type}
      </span>
      <span className="font-semibold" style={{ color: C.navy }}>{rest.join(" ")}</span>
    </span>
  );
}

function laneBadge(available: boolean | null) {
  if (available === true) return <ReportBadge tone="success"><Check size={10} strokeWidth={2.5} />Lane available</ReportBadge>;
  if (available === false) return <ReportBadge tone="danger"><Link2Off size={10} />Lane unavailable</ReportBadge>;
  return <ReportBadge tone="warning"><Clock size={10} />Not set</ReportBadge>;
}

type PlantOutcome = {
  plantCode: string;
  productionPlan: string;
  finalFgProducible: number;
  productionStopDate: string;
  planChangeRequired: boolean;
};

function computePlantOutcome(
  plantCode: string,
  scenarioId: string,
  transfer: IUTOption | null,
  moqPlant: MOQPlantOption | null,
  moqSuppliers: Record<string, string>,
): PlantOutcome {
  const base = PLANT_BREAKDOWN_BASE[plantCode];
  const roles: PlantRole[] = [];
  if (transfer?.routeFrom === plantCode) roles.push("source");
  if (transfer?.routeTo === plantCode) roles.push("destination");
  if (moqPlant?.plant === plantCode) roles.push("ordering");
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
  return {
    plantCode,
    productionPlan: base.totalProductionPlan,
    finalFgProducible: qty,
    productionStopDate: date,
    planChangeRequired: date !== base.prodStopDate,
  };
}

export function ScenarioComparisonReportCard({
  scenarioId,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  scenarioId: string;
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return null;
  const baseline = SCENARIOS.find((s) => s.id === "no-action")!;

  const isCombo = scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showIUT = scenarioId === "iut" || isCombo;
  const showMOQ = scenarioId === "moq" || isCombo;
  const moqPlantData = scenarioId === "iut-moq-break" ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;
  const transferCount = scenarioId === "iut-moq" ? 3 : 2;
  const transferOptions = showIUT ? IUT_TRANSFER_OPTIONS.slice(0, transferCount) : [];

  type Plan = { id: string; label: string; transfer: IUTOption | null; isSelected: boolean };
  const plans: Plan[] = transferOptions.length > 0
    ? transferOptions.map((t, i) => ({ id: t.id, label: `Option ${i + 1}`, transfer: t, isSelected: t.id === selTransfer }))
    : showMOQ
      ? [{ id: "moq-only", label: "Procurement Plan", transfer: null, isSelected: true }]
      : [];

  const coverDelta =
    scenario.fgDaysCover && baseline.fgDaysCover
      ? parseInt(scenario.fgDaysCover, 10) - parseInt(baseline.fgDaysCover, 10)
      : 0;

  const content = (
    <div
      className="flex flex-col gap-3"
      style={isFullscreen ? { padding: 16, height: "100%", overflow: "auto" } : undefined}
    >
      {/* ── Executive summary + Quick compare combined into a single card ── */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #e2e8f0", borderLeft: `3px solid ${scenario.isBest ? C.green : C.blue}` }}
      >
        <div className="px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ backgroundColor: C.bgBlue }}>
          <span className="text-xs font-bold shrink-0" style={{ color: C.navy }}>{scenario.name}</span>
          {scenario.isBest && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
              <Star size={8} fill="currentColor" />Recommended
            </span>
          )}
          <span className="text-[10px] shrink-0" style={{ color: "#cbd5e1" }}>│</span>
          <p className="text-[10px]" style={{ color: "#64748b" }}>
            {SCENARIO_NARRATIVE[scenarioId] ?? ""}
          </p>
          <span className="text-[10px] shrink-0" style={{ color: "#cbd5e1" }}>│</span>
          <span className="text-[11px] shrink-0" style={{ color: "#64748b" }}>
            Waste <b style={{ color: C.navy }}>{scenario.businessWaste ?? "—"}</b>
            {scenario.wasteSavings && (
              <span className="ml-1 font-semibold" style={{ color: C.green }}>↓ {scenario.wasteSavings}</span>
            )}
          </span>
          <span className="text-[11px] shrink-0" style={{ color: "#64748b" }}>
            Cover <b style={{ color: C.navy }}>{scenario.fgDaysCover ?? "—"}</b>
            {coverDelta > 0 && (
              <span className="ml-1 font-semibold" style={{ color: C.green }}>+{coverDelta}d</span>
            )}
          </span>
          <span className="text-[11px] shrink-0" style={{ color: "#64748b" }}>
            Stops <b style={{ color: C.navy }}>{scenario.productionStopDate}</b>
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="flex items-center cursor-pointer justify-center rounded-md shrink-0 transition-colors hover:bg-white ml-auto"
            style={{ width: 24, height: 24, color: C.navy, border: "1px solid #cbd5e1" }}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>

        {/* Quick compare — only meaningful when there's more than one routing option */}
        {plans.length > 1 && (
          <>
            <div className="px-3 py-1" style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                Quick compare — click a row to select
              </p>
            </div>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#fff" }}>
                  {["Route", "Business Waste", "Lane", "Lead Time", ""].map((h) => (
                    <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8", borderBottom: "1px solid #e2e8f0" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const t = plan.transfer!;
                  return (
                    <tr
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelTransfer(t.id)}
                      onKeyDown={(e) => e.key === "Enter" && onSelTransfer(t.id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: plan.isSelected ? "#EFF4FB" : "#fff",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ color: C.navy }}>{t.routeFrom} → {t.routeTo}</span>
                          {t.isBest && <ReportBadge tone="success"><Star size={9} fill="currentColor" />Best route</ReportBadge>}
                          {plan.isSelected && <ReportBadge tone="info">Selected</ReportBadge>}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="font-bold tabular-nums" style={{ color: "#374151" }}>₹{t.businessWasteAfter.toLocaleString("en-IN")}</span>
                        <span className="ml-1.5 text-[10px] font-semibold" style={{ color: C.green }}>↓ ₹{t.reductionVsNoAction.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-3 py-1.5">{laneBadge(t.laneAvailable)}</td>
                      <td className="px-3 py-1.5 tabular-nums" style={{ color: "#374151" }}>{t.transferLeadTime}</td>
                      <td className="px-3 py-1.5 text-right">
                        {!plan.isSelected && (
                          <span className="text-[11px] font-semibold" style={{ color: C.blue }}>Select →</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* ── Detailed report card per plan — side by side so options can be scanned across ── */}
      <div className="flex items-start gap-3 overflow-x-auto pb-1">
        {plans.map((plan) => (
        <div
          key={plan.id}
          className="rounded-xl overflow-hidden bg-white shrink-0"
          style={{
            border: plan.isSelected ? `2px solid ${C.blue}` : "1px solid #e2e8f0",
            boxShadow: plan.isSelected ? "0 2px 10px rgba(21,101,192,0.12)" : "0 1px 4px rgba(0,48,135,0.06)",
            // Cards size to their content (fixed 2-col grids below) instead of
            // growing to fill the row — keeps them tight instead of stretching
            // out with empty space when there are only 1-2 options.
            flex: "0 0 420px",
            width: 420,
          }}
        >
          {/* Plan header */}
          <div
            className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
            style={{ backgroundColor: plan.isSelected ? C.bgBlue : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-xs font-bold" style={{ color: C.navy }}>{plan.label}</span>
              {plan.transfer && (
                <span className="text-[11px]" style={{ color: "#475569" }}>
                  {plan.transfer.routeFrom} <span style={{ color: C.blue }}>→</span> {plan.transfer.routeTo}
                </span>
              )}
              {plan.transfer?.isBest && <ReportBadge tone="success"><Star size={9} fill="currentColor" />Best route</ReportBadge>}
            </div>
            {plan.transfer && (
              plan.isSelected ? (
                <ReportBadge tone="info"><Check size={10} strokeWidth={2.5} />Selected plan</ReportBadge>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelTransfer(plan.transfer!.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-90"
                  style={{ backgroundColor: C.blue, color: "#fff" }}
                >
                  Use this option
                </button>
              )
            )}
          </div>

          {plan.transfer && (
            <div className="px-3 py-2 flex items-baseline gap-2 flex-wrap" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <LabelValue label="Business Waste (this route)">
                <span className="font-bold tabular-nums text-xs" style={{ color: "#374151" }}>₹{plan.transfer.businessWasteAfter.toLocaleString("en-IN")}</span>
                <span className="ml-2 text-[10px] font-semibold tabular-nums" style={{ color: C.green }}>↓ ₹{plan.transfer.reductionVsNoAction.toLocaleString("en-IN")} vs No Action</span>
              </LabelValue>
            </div>
          )}

          {/* IUT transfer detail */}
          {plan.transfer && (
            <>
              <ReportSectionHeading icon={<ArrowLeftRight size={11} />} title="Stock Transfer (IUT)" tint="#f0fdfa" />
              <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-2">
                <LabelValue label="Material">{materialBadge(plan.transfer.material)}</LabelValue>
                <LabelValue label="Transfer Qty">{plan.transfer.transferQty.toLocaleString("en-IN")} units</LabelValue>
                <LabelValue label="Lead Time">{plan.transfer.transferLeadTime}</LabelValue>
                <LabelValue label="Initiation Date">{plan.transfer.initiationDate}</LabelValue>
                <LabelValue label="Lane Availability">{laneBadge(plan.transfer.laneAvailable)}</LabelValue>
                <LabelValue label="Cost / Trip">₹{plan.transfer.costPerTrip.toLocaleString("en-IN")}</LabelValue>
              </div>
            </>
          )}

          {/* Procurement detail */}
          {showMOQ && (
            <>
              <ReportSectionHeading
                icon={<ShoppingCart size={11} />}
                title="Procurement"
                subtitle={plan.transfer ? "shared across routing options — edit only from the selected route" : undefined}
                tint="#fdf4ff"
              />
              <div className="px-3 py-2 flex flex-col gap-2">
                {moqPlantData.map((moqPlant) => {
                  const supplier =
                    moqPlant.suppliers.find((s) => s.id === moqSuppliers[moqPlant.id]) ?? moqPlant.suppliers[0];
                  const canEdit = plan.isSelected;
                  const totalCost = moqPlant.orderQty * supplier.pricePerUnit;
                  return (
                    <div
                      key={moqPlant.id}
                      className="rounded-lg px-2.5 py-2"
                      style={{ backgroundColor: "#fafafa", border: "1px solid #f1f5f9" }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: C.navy }}>{moqPlant.plant}</span>
                        {materialBadge(moqPlant.material)}
                        {moqPlant.moqBroken != null && <ReportBadge tone="warning">Broken to {moqPlant.moqBroken.toLocaleString("en-IN")} units</ReportBadge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <LabelValue label="Supplier">
                          {canEdit ? (
                            <select
                              value={supplier.id}
                              onChange={(e) => onMoqSupplier(moqPlant.id, e.target.value)}
                              className="text-xs rounded px-2 py-1 cursor-pointer w-full"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                            >
                              {moqPlant.suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-semibold">{supplier.name}</span>
                          )}
                        </LabelValue>
                        <LabelValue label="Order Qty">{moqPlant.orderQty.toLocaleString("en-IN")} units</LabelValue>
                        <LabelValue label="MOQ">{supplier.moq.toLocaleString("en-IN")} units</LabelValue>
                        <LabelValue label="Price / Unit">₹{supplier.pricePerUnit}</LabelValue>
                        <LabelValue label="Total Order Cost">
                          <span className="font-bold" style={{ color: C.navy }}>₹{totalCost.toLocaleString("en-IN")}</span>
                        </LabelValue>
                        <LabelValue label="Production Date">{supplier.productionDate}</LabelValue>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Per-plant outcome */}
          <ReportSectionHeading icon={<Factory size={11} />} title="Per-Plant Outcome" tint="#fff7ed" />
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {PLANTS.map((plantCode) => {
              const moqPlant = showMOQ ? moqPlantData.find((p) => p.plant === plantCode) ?? null : null;
              const outcome = computePlantOutcome(plantCode, scenarioId, plan.transfer, moqPlant, moqSuppliers);
              return (
                <div
                  key={plantCode}
                  className="rounded-lg px-2.5 py-2 flex flex-col gap-1"
                  style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: C.navy }}>{plantCode}</span>
                    {outcome.planChangeRequired ? (
                      <ReportBadge tone="warning">Plan change required</ReportBadge>
                    ) : (
                      <ReportBadge tone="success">No plan change</ReportBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] flex-wrap" style={{ color: "#64748b" }}>
                    <span className="tabular-nums">{outcome.productionPlan}</span>
                    <span style={{ color: C.blue }}>→</span>
                    <span className="font-bold tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(outcome.finalFgProducible)} FG units</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#374151" }}>
                    <Calendar size={10} style={{ color: "#94a3b8" }} />
                    {outcome.productionStopDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="rounded-xl px-5 py-6 text-center" style={{ border: "1px dashed #e2e8f0", color: "#94a3b8" }}>
          <p className="text-xs">No mitigating action is taken under this scenario — refer to the summary above.</p>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return createPortal(
      <div className="fixed inset-0 bg-white" style={{ zIndex: 100 }}>
        {content}
      </div>,
      document.body,
    );
  }

  return content;
}
