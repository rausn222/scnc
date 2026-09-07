import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Check,
  Clock,
  Factory,
  LayoutGrid,
  Link2Off,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Star,
  Table2,
} from "lucide-react";
import type {
  TransferScenarioId,
  IUTOption,
  MOQPlantOption,
  MOQSupplierData,
  PlantRole,
} from "../../sciDetails/types";
import {
  C,
  IUT_TRANSFER_OPTIONS,
  SCENARIOS,
  RM_BADGE,
  PM_BADGE,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  PLANT_BREAKDOWN_BASE,
} from "../../sciDetails/constants";
import { bizWasteColor, computeAfterQtyAndDate, formatIndianNumber } from "../../sciDetails/utils";
import { ReportBadge, ReportSectionHeading } from "../../sciDetails/step3report/ReportPrimitives";

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

export function ScenarioDetailCard({
  scenarioId,
  cardDefs,
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
  contentMode,
}: {
  scenarioId: string;
  cardDefs: { sid: string; transferId: TransferScenarioId | null }[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
  /** When set, locks the Quick Compare card content to this layout and hides the Panels/Table toggle. */
  contentMode?: "panels" | "table";
}) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Each option card's inner content: side-by-side panels (Scenario Summary / IUT Flow /
  // Procurement), or the same fields arranged as a single table — the two option cards
  // themselves always stay side by side either way.
  const [internalCardContentMode, setInternalCardContentMode] = useState<"panels" | "table">("panels");
  const cardContentMode = contentMode ?? internalCardContentMode;
  const showContentToggle = contentMode === undefined;

  // Which option's card is currently in edit mode, and the user's edits for it —
  // options are shared module-level data, so edits are kept as per-id overrides
  // rather than mutating the underlying constants.
  const [customisingId, setCustomisingId] = useState<string | null>(null);
  const [optionOverrides, setOptionOverrides] = useState<
    Record<string, Partial<Pick<IUTOption, "transferQty" | "transferLeadTime" | "costPerTrip" | "initiationDate">>>
  >({});
  const [moqOrderQtyOverrides, setMoqOrderQtyOverrides] = useState<Record<string, number>>({});

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

  const showTransfer =
    scenarioId === "iut" || scenarioId === "iut-moq" || scenarioId === "iut-moq-break";
  const showMOQTable = scenarioId === "moq";

  // Primary = IUT card (first). Secondary = additional scenarios shown below (e.g. MOQ in combo).
  const primaryDef = cardDefs[0];
  const secondaryDefs = cardDefs.slice(1);
  const primaryScenario = SCENARIOS.find((s) => s.id === primaryDef.sid);

  // Quick Compare is capped at the best 2 routing options.
  const compareOptions = showTransfer ? IUT_TRANSFER_OPTIONS.slice(0, 2) : [];
  const showComboProcurement = showTransfer && secondaryDefs.some((d) => d.sid === "moq");
  const moqPlantData = scenarioId === "iut-moq-break" ? MOQ_PLANT_OPTIONS_BREAK : MOQ_PLANT_OPTIONS;

  if (!primaryScenario) return null;

  const isComboLayout = showComboProcurement;
  const overallScenario = SCENARIOS.find((s) => s.id === scenarioId) ?? primaryScenario;

  const computeOutcome = (plantCode: string, transfer: IUTOption | null, moqPlant: MOQPlantOption | null) => {
    const base = PLANT_BREAKDOWN_BASE[plantCode];
    if (!base) return null;
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
    return { plantCode, finalFgProducible: qty, productionStopDate: date, planChangeRequired: date !== base.prodStopDate };
  };

  const renderOptionCards = (option: IUTOption, idx: number) => {
    const isSelected = selTransfer === option.id;
    const isCustomising = customisingId === option.id;
    const effOption: IUTOption = { ...option, ...optionOverrides[option.id] };
    const effMoqPlantData = moqPlantData.map((p) => ({
      ...p,
      orderQty: moqOrderQtyOverrides[p.id] ?? p.orderQty,
    }));
    const plantOutcomes = Object.keys(PLANT_BREAKDOWN_BASE)
      .map((code) => computeOutcome(code, effOption, showComboProcurement ? effMoqPlantData.find((p) => p.plant === code) ?? null : null))
      .filter((o): o is NonNullable<typeof o> => o !== null);
    const totalFg = plantOutcomes.reduce((sum, o) => sum + o.finalFgProducible, 0);
    const procurementCost = showComboProcurement
      ? effMoqPlantData.reduce((sum, plant) => {
          const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
          return sum + plant.orderQty * supplier.pricePerUnit;
        }, 0)
      : 0;
    const totalCost = effOption.costPerTrip + procurementCost;

    const tableRow = (label: string, value: React.ReactNode, key?: string) => (
      <tr key={key ?? label} style={{ borderBottom: "1px solid #f1f5f9" }}>
        <td className="px-2.5 py-1.5 text-[10px] font-semibold align-top" style={{ color: "#94a3b8", width: "42%" }}>{label}</td>
        <td className="px-2.5 py-1.5 text-xs" style={{ color: "#374151" }}>{value}</td>
      </tr>
    );
    // Fills its share of the row (flex: 1 1 0) instead of a fixed pixel width, so IUT Flow
    // and Procurement always stretch to use the option card's full width with no blank gap.
    const tablePanel = (
      title: string,
      icon: React.ReactNode,
      bg: string,
      color: string,
      minWidth: number,
      rows: React.ReactNode,
    ) => (
      <div key={title} className="rounded-lg overflow-hidden bg-white" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0", flex: "1 1 0", minWidth }}>
        <div className="px-2.5 py-1.5" style={{ backgroundColor: bg }}>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
            {icon}{title}
          </span>
        </div>
        <table className="border-collapse" style={{ width: "100%" }}>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );

    return (
      <div
        key={option.id}
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: isSelected ? `2px solid ${C.blue}` : "1px solid #e2e8f0",
          boxShadow: isSelected ? "0 2px 10px rgba(21,101,192,0.12)" : "0 1px 4px rgba(0,48,135,0.06)",
        }}
      >
        {/* Option header — route summary + Customise / Select. Clicking the title area
            selects the option, mirroring the table view's click-a-column-header behavior. */}
        <div
          className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap cursor-pointer select-none"
          style={{ backgroundColor: isSelected ? C.bgBlue : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
          onClick={() => handleSelTransfer(option.id)}
          title="Click to make this the selected plan"
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
              onClick={(e) => {
                e.stopPropagation();
                setCustomisingId((id) => (id === option.id ? null : option.id));
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleSelTransfer(option.id);
              }}
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

        {/* Card content: Scenario Summary as visual stat tiles (clearer at a glance than a
            row-table), spanning the top; IUT Flow and Procurement as tables filling the
            row underneath it with no leftover blank space. */}
        {cardContentMode === "table" ? (
          <div className="p-3 flex flex-col gap-3">
            <div className="rounded-lg overflow-hidden bg-white" style={{ border: "1px solid #e2e8f0" }}>
              <ReportSectionHeading icon={<Factory size={11} />} title="Scenario Summary" tint={C.bgBlue} />
              <div className="p-3 flex items-stretch gap-2 flex-wrap">
                <div className="rounded-lg px-3 py-2 shrink-0" style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}`, minWidth: 110 }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.blue }}>Total Cost</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: C.blue }}>₹{formatIndianNumber(totalCost)}</div>
                </div>
                <div className="rounded-lg px-3 py-2 shrink-0" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", minWidth: 110 }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#166534" }}>Total FG</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: "#166534" }}>{formatIndianNumber(totalFg)}</div>
                </div>
                {plantOutcomes.map((o) => (
                  <div key={o.plantCode} className="rounded-lg px-3 py-2" style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9", flex: "1 1 200px" }}>
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold" style={{ color: C.navy }}>{o.plantCode}</span>
                      {o.planChangeRequired ? (
                        <ReportBadge tone="warning">Plan change needed</ReportBadge>
                      ) : (
                        <ReportBadge tone="success">No plan change</ReportBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="text-[11px]" style={{ color: "#374151" }}>
                        FG Producible <b className="tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(o.finalFgProducible)}</b>
                      </div>
                      <div className="text-[11px]" style={{ color: "#374151" }}>
                        Stop Date <b>{o.productionStopDate}</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-stretch gap-3">
            {tablePanel(
              "IUT Flow",
              <ArrowLeftRight size={10} />,
              "#f0fdfa",
              C.navy,
              230,
              <>
                {tableRow("Material", materialBadge(option.material))}
                {tableRow("Route", <span className="font-bold" style={{ color: C.navy }}>{option.routeFrom} <span style={{ color: C.blue }}>→</span> {option.routeTo}</span>)}
                {tableRow(
                  "Transfer Qty",
                  isCustomising ? (
                    <input
                      type="number"
                      min={0}
                      value={effOption.transferQty}
                      onChange={(e) => updateOptionOverride(option.id, { transferQty: Number(e.target.value) || 0 })}
                      className="w-20 text-xs tabular-nums rounded px-1.5 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <b className="tabular-nums" style={{ color: C.blue }}>{effOption.transferQty.toLocaleString("en-IN")} EA</b>
                  ),
                )}
                {tableRow(
                  "Lead Time",
                  isCustomising ? (
                    <input
                      type="text"
                      value={effOption.transferLeadTime}
                      onChange={(e) => updateOptionOverride(option.id, { transferLeadTime: e.target.value })}
                      className="w-20 text-xs rounded px-1.5 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: "#374151", outline: "none" }}
                    />
                  ) : (
                    effOption.transferLeadTime
                  ),
                )}
                {tableRow(
                  "Initiation Date",
                  isCustomising ? (
                    <input
                      type="text"
                      value={effOption.initiationDate}
                      onChange={(e) => updateOptionOverride(option.id, { initiationDate: e.target.value })}
                      className="w-24 text-xs font-semibold rounded px-1.5 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <b style={{ color: C.navy }}>{effOption.initiationDate}</b>
                  ),
                )}
                {tableRow("Lane", laneBadge(option.laneAvailable))}
                {tableRow(
                  "Cost / Trip",
                  isCustomising ? (
                    <input
                      type="number"
                      min={0}
                      value={effOption.costPerTrip}
                      onChange={(e) => updateOptionOverride(option.id, { costPerTrip: Number(e.target.value) || 0 })}
                      className="w-20 text-xs font-semibold rounded px-1.5 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <b style={{ color: C.navy }}>₹{effOption.costPerTrip}</b>
                  ),
                )}
              </>,
            )}

            {/* Rows stack per plant (not a grid) in table mode, so a fixed width holds
                regardless of plant count — values wrap instead of forcing a wider scroll. */}
            {showComboProcurement && tablePanel(
              `Procurement · ${effMoqPlantData.length} orders`,
              <ShoppingCart size={10} />,
              "#fdf4ff",
              "#7c3aed",
              260,
              <>
                {effMoqPlantData.map((plant, pi) => {
                  const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                  const estTotal = plant.orderQty * supplier.pricePerUnit;
                  return (
                    <React.Fragment key={plant.id}>
                      {/* Group header — plant + material, replaces repeating "{plant} ·" on every row */}
                      <tr style={{ backgroundColor: "#fafafa", borderTop: pi > 0 ? "2px solid #f1f5f9" : undefined }}>
                        <td colSpan={2} className="px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                            {materialBadge(plant.material)}
                          </div>
                        </td>
                      </tr>
                      {tableRow(
                        "Supplier",
                        isCustomising ? (
                          <select
                            value={supplier.id}
                            onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                            className="text-xs rounded px-1.5 py-0.5 cursor-pointer"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                          >
                            {plant.suppliers.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <b style={{ color: C.blue }}>{supplier.name}</b>
                        ),
                        `${plant.id}-sup`,
                      )}
                      {tableRow(
                        "Order Qty (MOQ)",
                        <span className="flex items-center gap-1.5 flex-wrap">
                          {isCustomising ? (
                            <input
                              type="number"
                              min={0}
                              value={plant.orderQty}
                              onChange={(e) => updateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                              className="w-20 text-xs tabular-nums rounded px-1.5 py-0.5"
                              style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                            />
                          ) : (
                            <b className="tabular-nums">{formatIndianNumber(plant.orderQty)}</b>
                          )}
                          <span className="text-[10px]" style={{ color: "#94a3b8" }}>MOQ {formatIndianNumber(supplier.moq)}</span>
                        </span>,
                        `${plant.id}-oq`,
                      )}
                      {tableRow(
                        "Price/Unit · Est. Total",
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <b className="tabular-nums">₹{supplier.pricePerUnit}</b>
                          <span style={{ color: "#cbd5e1" }}>·</span>
                          <b className="tabular-nums" style={{ color: C.navy }}>₹{formatIndianNumber(estTotal)}</b>
                        </span>,
                        `${plant.id}-price`,
                      )}
                      {tableRow("Production", supplier.productionDate, `${plant.id}-prod`)}
                    </React.Fragment>
                  );
                })}
              </>,
            )}
            </div>
          </div>
        ) : (
        <div className="p-3 flex items-stretch gap-3 overflow-x-auto">
          {/* Outcome summary */}
          <div className="rounded-lg shrink-0" style={{ border: "1px solid #e2e8f0", width: 230 }}>
            <ReportSectionHeading icon={<Factory size={11} />} title="Scenario Summary" tint={C.bgBlue} />
            <div className="px-3 py-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg px-2.5 py-2" style={{ backgroundColor: C.bgBlue, border: `1px solid ${C.borderBlue}` }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.blue }}>Total Cost</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: C.blue }}>₹{formatIndianNumber(totalCost)}</div>
                </div>
                <div className="flex-1 rounded-lg px-2.5 py-2" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#166534" }}>Total FG</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: "#166534" }}>{formatIndianNumber(totalFg)}</div>
                </div>
              </div>
              {plantOutcomes.map((o) => (
                <div key={o.plantCode} className="rounded-lg px-2.5 py-2 flex flex-col gap-1" style={{ backgroundColor: "#fff", border: "1px solid #f1f5f9" }}>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[11px] font-bold" style={{ color: C.navy }}>{o.plantCode}</span>
                    {o.planChangeRequired ? (
                      <ReportBadge tone="warning">Plan change needed</ReportBadge>
                    ) : (
                      <ReportBadge tone="success">No plan change</ReportBadge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div className="text-[11px]" style={{ color: "#374151" }}>
                      FG Producible <b className="tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(o.finalFgProducible)}</b>
                    </div>
                    <div className="text-[11px]" style={{ color: "#374151" }}>
                      Stop Date <b>{o.productionStopDate}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IUT flow */}
          <div className="rounded-lg shrink-0 bg-white" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0", width: 230 }}>
            <ReportSectionHeading icon={<ArrowLeftRight size={11} />} title="IUT Flow" tint="#f0fdfa" />
            <div className="px-3 py-2 flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">{materialBadge(option.material)}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-center">
                  <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>From</div>
                  <div className="text-xs font-bold" style={{ color: C.navy }}>{option.routeFrom}</div>
                </div>
                <div className="flex flex-col items-center flex-1 min-w-0 gap-0.5">
                  {isCustomising ? (
                    <input
                      type="number"
                      min={0}
                      value={effOption.transferQty}
                      onChange={(e) => updateOptionOverride(option.id, { transferQty: Number(e.target.value) || 0 })}
                      className="w-full text-center text-[10px] font-semibold tabular-nums rounded px-1 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <span className="text-[10px] font-semibold tabular-nums whitespace-nowrap" style={{ color: C.blue }}>
                      {effOption.transferQty.toLocaleString("en-IN")} EA
                    </span>
                  )}
                  <ArrowLeftRight size={12} style={{ color: C.blue }} />
                  {isCustomising ? (
                    <input
                      type="text"
                      value={effOption.transferLeadTime}
                      onChange={(e) => updateOptionOverride(option.id, { transferLeadTime: e.target.value })}
                      className="w-full text-center text-[9px] rounded px-1 py-0.5"
                      style={{ border: `1px solid ${C.blue}`, color: "#374151", outline: "none" }}
                    />
                  ) : (
                    <span className="text-[9px] whitespace-nowrap" style={{ color: "#94a3b8" }}>{effOption.transferLeadTime} lead</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-semibold uppercase" style={{ color: "#94a3b8" }}>To</div>
                  <div className="text-xs font-bold" style={{ color: C.navy }}>{option.routeTo}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded px-1 py-1.5 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Initiation</div>
                  {isCustomising ? (
                    <input
                      type="text"
                      value={effOption.initiationDate}
                      onChange={(e) => updateOptionOverride(option.id, { initiationDate: e.target.value })}
                      className="w-full text-center text-[10px] font-semibold rounded px-1"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <div className="text-[10px] font-semibold" style={{ color: C.navy }}>{effOption.initiationDate}</div>
                  )}
                </div>
                <div className="rounded px-1 py-1.5 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Lane</div>
                  {laneBadge(option.laneAvailable)}
                </div>
                <div className="rounded px-1 py-1.5 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Cost/Trip</div>
                  {isCustomising ? (
                    <input
                      type="number"
                      min={0}
                      value={effOption.costPerTrip}
                      onChange={(e) => updateOptionOverride(option.id, { costPerTrip: Number(e.target.value) || 0 })}
                      className="w-full text-center text-[10px] font-semibold rounded px-1"
                      style={{ border: `1px solid ${C.blue}`, color: C.navy, outline: "none" }}
                    />
                  ) : (
                    <div className="text-[10px] font-semibold" style={{ color: C.navy }}>₹{effOption.costPerTrip}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Procurement (combo scenarios only) */}
          {showComboProcurement && (() => {
            // Two or fewer orders read fine as a single stacked column (the
            // original layout); once there are more, a 2-column grid keeps
            // the card from growing too tall.
            const twoColumn = effMoqPlantData.length > 2;
            return (
            <div className="rounded-lg shrink-0 bg-white" style={{ border: isCustomising ? `1px solid ${C.blue}` : "1px solid #e2e8f0", width: twoColumn ? 480 : 250 }}>
              <ReportSectionHeading icon={<ShoppingCart size={11} />} title="Procurement" subtitle={`${effMoqPlantData.length} orders`} tint="#fdf4ff" />
              <div className={twoColumn ? "px-3 py-2 grid grid-cols-2 gap-2" : "px-3 py-2 flex flex-col gap-2"}>
                {effMoqPlantData.map((plant) => {
                  const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                  return (
                    <div key={plant.id} className="rounded-lg px-2.5 py-2" style={{ backgroundColor: "#fafafa", border: "1px solid #f1f5f9" }}>
                      <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                        <span className="text-[11px] font-bold" style={{ color: C.navy }}>{plant.plant}</span>
                        {materialBadge(plant.material)}
                      </div>
                      <div className="mb-1.5">
                        {isCustomising ? (
                          <select
                            value={supplier.id}
                            onChange={(e) => handleMoqSupplier(plant.id, e.target.value)}
                            className="text-[10px] rounded px-1.5 py-0.5 cursor-pointer"
                            style={{ border: `1px solid ${C.blue}`, color: C.navy, backgroundColor: "#fff", outline: "none" }}
                          >
                            {plant.suppliers.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-semibold" style={{ color: C.blue }}>{supplier.name}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] items-center" style={{ color: "#374151" }}>
                        {isCustomising ? (
                          <span className="flex items-center gap-1">
                            <span>Order Qty</span>
                            <input
                              type="number"
                              min={0}
                              value={plant.orderQty}
                              onChange={(e) => updateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                              className="w-16 text-center tabular-nums rounded px-1 py-0.5"
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
                      <div className="mt-1.5 text-[9px]" style={{ color: "#94a3b8" }}>Production: {supplier.productionDate}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}
        </div>
        )}
      </div>
    );
  };

  const cardBody = (
    <>
      {/* ── Card header — full screen toggle ── */}
      <div
        className="px-3 py-1.5 flex items-center justify-between gap-2"
        style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}
      >
        <span className="text-xs font-bold truncate" style={{ color: C.navy }}>
          {overallScenario.name}
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
                    { label: "Business Waste", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-bold tabular-nums" style={{ color: bizWasteColor(s.bizWaste) }}>₹{s.bizWaste.toLocaleString("en-IN")}</span> },
                    { label: "Material", render: (p: MOQPlantOption, _s: MOQSupplierData) => { const [type, ...rest] = p.material.split(" "); const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" }; return <span className="flex items-center justify-center gap-1.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>{type}</span><span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span></span>; } },
                    { label: "Order Qty", render: (p: MOQPlantOption, _s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>{p.orderQty.toLocaleString("en-IN")} units</span> },
                    { label: "MOQ", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold tabular-nums" style={{ color: "#374151" }}>{s.moq.toLocaleString("en-IN")} units</span> },
                    { label: "Price / Unit", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs tabular-nums" style={{ color: "#374151" }}>₹{s.pricePerUnit}</span> },
                    { label: "Production Date", render: (_p: MOQPlantOption, s: MOQSupplierData) => <span className="text-xs font-semibold" style={{ color: "#374151" }}>{s.productionDate}</span> },
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

        {/* Quick Compare — all routing options shown side by side (capped at 2) */}
        {showTransfer && compareOptions.length > 0 && (
          <div>
            <div
              className="px-3 py-2 flex items-center justify-between gap-2 flex-wrap"
              style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#94a3b8" }}>
                  Quick Compare
                </span>
                <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                  {compareOptions.length} routing option{compareOptions.length > 1 ? "s" : ""} side by side
                </span>
              </div>
              {showContentToggle && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setInternalCardContentMode("panels")}
                    title="Panel layout inside each option card"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                    style={
                      cardContentMode === "panels"
                        ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                        : { backgroundColor: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
                    }
                  >
                    <LayoutGrid size={12} />
                    Panels
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalCardContentMode("table")}
                    title="Table layout inside each option card"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                    style={
                      cardContentMode === "table"
                        ? { backgroundColor: C.navy, color: "#fff", border: `1px solid ${C.navy}` }
                        : { backgroundColor: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }
                    }
                  >
                    <Table2 size={12} />
                    Table
                  </button>
                </div>
              )}
            </div>
            <div className="p-3 flex flex-wrap items-start gap-3">
              {compareOptions.map((o, i) => (
                <div key={o.id} className="flex-1" style={{ minWidth: 480 }}>
                  {renderOptionCards(o, i)}
                </div>
              ))}
            </div>
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
              onClick={() => setHasChanges(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "#e2e8f0", color: "#64748b" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                setHasChanges(false);
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
      style={{ width: isComboLayout || showTransfer ? "100%" : "max-content", minWidth: isComboLayout || showTransfer ? undefined : "50%", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {cardBody}
    </div>
  );
}
