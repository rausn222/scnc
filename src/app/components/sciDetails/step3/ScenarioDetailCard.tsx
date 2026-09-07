import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Check,
  Clock,
  Factory,
  Link2Off,
  Maximize2,
  Minimize2,
  ShoppingCart,
  Star,
} from "lucide-react";
import type {
  TransferScenarioId,
  IUTOption,
  MOQPlantOption,
  MOQSupplierData,
  PlantRole,
} from "../types";
import {
  C,
  IUT_TRANSFER_OPTIONS,
  SCENARIOS,
  RM_BADGE,
  PM_BADGE,
  MOQ_PLANT_OPTIONS,
  MOQ_PLANT_OPTIONS_BREAK,
  PLANT_BREAKDOWN_BASE,
} from "../constants";
import { bizWasteColor, computeAfterQtyAndDate, formatIndianNumber } from "../utils";
import { ReportBadge, ReportSectionHeading } from "../step3report/ReportPrimitives";

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
}: {
  scenarioId: string;
  cardDefs: { sid: string; transferId: TransferScenarioId | null }[];
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const [activeOptionId, setActiveOptionId] = useState<string>(
    () => compareOptions.find((o) => o.id === selTransfer)?.id ?? compareOptions[0]?.id ?? "",
  );

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
              onClick={() => handleSelTransfer(option.id)}
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

        {/* Card row: Outcome summary · IUT flow · Procurement (combo scenarios only) */}
        <div className="p-3 flex items-stretch gap-3 overflow-x-auto">
          {/* Outcome summary */}
          <div className="rounded-lg shrink-0" style={{ border: "1px solid #e2e8f0", width: 230 }}>
            <ReportSectionHeading icon={<Factory size={11} />} title="Scenario Summary" tint="#fff7ed" />
            <div className="px-3 py-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg px-2.5 py-2" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#c2410c" }}>Total Cost</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: "#c2410c" }}>₹{formatIndianNumber(totalCost)}</div>
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
      </div>
    );
  };

  const activeOption = compareOptions.find((o) => o.id === activeOptionId) ?? compareOptions[0];
  const activeIdx = activeOption ? compareOptions.findIndex((o) => o.id === activeOption.id) : -1;

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

        {/* Quick Compare — routing options as selectable cards, capped at 2 */}
        {showTransfer && compareOptions.length > 0 && (
          <div>
            <div
              className="px-3 py-2 flex items-center gap-2 flex-wrap"
              style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#94a3b8" }}>
                Quick Compare
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {compareOptions.map((o, i) => {
                  const isActive = activeOption?.id === o.id;
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
                      {selTransfer === o.id && (
                        <Check size={10} strokeWidth={3} style={{ color: isActive ? "#86efac" : C.green }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-3">
              {activeOption && activeIdx >= 0 ? renderOptionCards(activeOption, activeIdx) : null}
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
