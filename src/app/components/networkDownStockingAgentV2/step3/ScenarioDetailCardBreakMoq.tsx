import { useState } from "react";
import { ArrowLeftRight, Check, Clock, Factory, Link2Off, ShoppingCart, Star } from "lucide-react";
import type { IUTOption, MOQPlantOption, PlantRole } from "../../sciDetails/types";
import { C, IUT_TRANSFER_OPTIONS, MOQ_PLANT_OPTIONS_BREAK, PLANT_BREAKDOWN_BASE, PM_BADGE, RM_BADGE } from "../../sciDetails/constants";
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

function StatTile({ label, value, tone }: { label: string; value: string; tone: "cost" | "fg" }) {
  const palette = tone === "cost" ? { label: C.blue, value: C.blue } : { label: "#166534", value: "#166534" };
  return (
    <div className="flex-1 rounded-lg px-3 py-2" style={{ border: "1px solid #e2e8f0" }}>
      <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: palette.label }}>{label}</div>
      <div className="text-base font-bold tabular-nums" style={{ color: palette.value }}>{value}</div>
    </div>
  );
}

const editInputStyle = { border: `1px solid ${C.blue}`, color: C.navy, outline: "none" } as const;

/**
 * Purpose-built "IUT + Break MOQ" comparison — a redesign of the original
 * tabbed ScenarioDetailCard for this one scenario. Both routing options are
 * shown side by side (not tab-switched) so they're comparable at a glance;
 * each option opens into the same edit fields the original card offered
 * (transfer qty/lead time/cost/date, order qty, supplier) via its own
 * Customise toggle, so nothing from the original workflow is lost — only
 * the read-only view is condensed.
 */
export function ScenarioDetailCardBreakMoq({
  selTransfer,
  onSelTransfer,
  moqSuppliers,
  onMoqSupplier,
}: {
  selTransfer: string;
  onSelTransfer: (id: string) => void;
  moqSuppliers: Record<string, string>;
  onMoqSupplier: (plantId: string, supplierId: string) => void;
}) {
  const options = IUT_TRANSFER_OPTIONS.slice(0, 2);

  // Which option's card is currently in edit mode, and the user's edits for it —
  // options are shared module-level data, so edits are kept as per-id overrides
  // rather than mutating the underlying constants.
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

  const computeOutcome = (plantCode: string, transfer: IUTOption, moqPlant: MOQPlantOption | null) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
      {options.map((option, idx) => {
        const isSelected = selTransfer === option.id;
        const isCustomising = customisingId === option.id;
        const effOption: IUTOption = { ...option, ...optionOverrides[option.id] };
        const effMoqPlantData = MOQ_PLANT_OPTIONS_BREAK.map((p) => ({
          ...p,
          orderQty: moqOrderQtyOverrides[p.id] ?? p.orderQty,
        }));
        const plantOutcomes = Object.keys(PLANT_BREAKDOWN_BASE)
          .map((code) => computeOutcome(code, effOption, effMoqPlantData.find((p) => p.plant === code) ?? null))
          .filter((o): o is NonNullable<typeof o> => o !== null);
        const totalFg = plantOutcomes.reduce((sum, o) => sum + o.finalFgProducible, 0);
        const procurementCost = effMoqPlantData.reduce((sum, plant) => {
          const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
          return sum + plant.orderQty * supplier.pricePerUnit;
        }, 0);
        const totalCost = effOption.costPerTrip + procurementCost;

        return (
          <div
            key={option.id}
            className="rounded-xl overflow-hidden bg-white flex flex-col"
            style={{
              border: isSelected ? `2px solid ${C.blue}` : "1px solid #e2e8f0",
              boxShadow: isSelected ? "0 2px 10px rgba(21,101,192,0.12)" : "0 1px 4px rgba(0,48,135,0.06)",
            }}
          >
            {/* Header — option label + route + Customise / Select */}
            <div
              className="px-3.5 py-2.5 flex items-center justify-between gap-2 flex-wrap"
              style={{ backgroundColor: isSelected ? C.bgBlue : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
            >
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-sm font-bold" style={{ color: C.navy }}>Option {idx + 1}</span>
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
                  onClick={() => onSelTransfer(option.id)}
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

            <div className="p-3.5 flex flex-col gap-3">
              {/* At-a-glance totals */}
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: C.bgBlue }}>
                  <Factory size={11} style={{ color: C.blue }} />
                  <span className="text-xs font-bold" style={{ color: C.blue }}>Scenario Summary</span>
                </div>
                <div className="p-3 flex gap-2">
                  <StatTile label="Total Cost" value={`₹${formatIndianNumber(totalCost)}`} tone="cost" />
                  <StatTile label="Total FG Producible" value={`${formatIndianNumber(totalFg)} EA`} tone="fg" />
                </div>
              </div>

              {/* IUT flow — route + material always visible, plus a labelled Qty/Lead
                  time/Initiation/Cost grid so every number reads clearly without
                  needing to open Customise; Customise just swaps the same slots
                  for inputs instead of adding a separate, differently-shaped view. */}
              <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isCustomising ? C.blue : "#e2e8f0"}` }}>
                <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f0fdfa" }}>
                  <ArrowLeftRight size={11} style={{ color: C.blue }} />
                  <span className="text-xs font-bold" style={{ color: C.navy }}>IUT Flow</span>
                </div>
                <div className="px-3 py-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {materialBadge(option.material)}
                  <span className="text-xs font-bold" style={{ color: C.navy }}>{option.routeFrom}</span>
                  <span style={{ color: "#94a3b8" }}>→</span>
                  <span className="text-xs font-bold" style={{ color: C.navy }}>{option.routeTo}</span>
                  <span className="ml-auto shrink-0">{laneBadge(option.laneAvailable)}</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Qty</span>
                    {isCustomising ? (
                      <input
                        type="number"
                        min={0}
                        value={effOption.transferQty}
                        onChange={(e) => updateOptionOverride(option.id, { transferQty: Number(e.target.value) || 0 })}
                        className="w-full text-center text-[10px] font-semibold tabular-nums rounded px-1 py-0.5"
                        style={editInputStyle}
                      />
                    ) : (
                      <span className="text-[10px] font-semibold tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                        {effOption.transferQty.toLocaleString("en-IN")} EA
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Lead time</span>
                    {isCustomising ? (
                      <input
                        type="text"
                        value={effOption.transferLeadTime}
                        onChange={(e) => updateOptionOverride(option.id, { transferLeadTime: e.target.value })}
                        className="w-full text-center text-[10px] rounded px-1 py-0.5"
                        style={editInputStyle}
                      />
                    ) : (
                      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: C.navy }}>{effOption.transferLeadTime}</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Initiation</span>
                    {isCustomising ? (
                      <input
                        type="text"
                        value={effOption.initiationDate}
                        onChange={(e) => updateOptionOverride(option.id, { initiationDate: e.target.value })}
                        className="w-full text-center text-[10px] font-semibold rounded px-1 py-0.5"
                        style={editInputStyle}
                      />
                    ) : (
                      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: C.navy }}>{effOption.initiationDate}</span>
                    )}
                  </label>
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-semibold uppercase" style={{ color: "#94a3b8" }}>Cost/trip</span>
                    {isCustomising ? (
                      <input
                        type="number"
                        min={0}
                        value={effOption.costPerTrip}
                        onChange={(e) => updateOptionOverride(option.id, { costPerTrip: Number(e.target.value) || 0 })}
                        className="w-full text-center text-[10px] font-semibold rounded px-1 py-0.5"
                        style={editInputStyle}
                      />
                    ) : (
                      <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: C.navy }}>₹{effOption.costPerTrip}</span>
                    )}
                  </label>
                </div>
                </div>
              </div>

              {/* Plant impact — one row per plant, with labelled FG Producible / Stop Date
                  instead of a terse "12,345 EA · Stop 28 Jun 2026" string. */}
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  <span className="text-xs font-bold" style={{ color: C.navy }}>Plant Impact</span>
                </div>
                <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
                {plantOutcomes.map((o) => (
                  <div key={o.plantCode} className="flex items-center justify-between gap-2 px-3 py-2 flex-wrap" style={{ backgroundColor: "#fff" }}>
                    <span className="text-[11px] font-bold shrink-0" style={{ color: C.navy }}>{o.plantCode}</span>
                    <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "#374151" }}>
                      <span>FG Producible <b className="tabular-nums" style={{ color: C.navy }}>{formatIndianNumber(o.finalFgProducible)} EA</b></span>
                      <span>Stop Date <b style={{ color: C.navy }}>{o.productionStopDate}</b></span>
                    </div>
                    {o.planChangeRequired ? (
                      <ReportBadge tone="warning">Plan change needed</ReportBadge>
                    ) : (
                      <ReportBadge tone="success">No plan change</ReportBadge>
                    )}
                  </div>
                ))}
                </div>
              </div>

              {/* Procurement — one row per broken-MOQ order; supplier + qty become editable under Customise */}
              <div className="rounded-lg" style={{ border: `1px solid ${isCustomising ? C.blue : "#e2e8f0"}` }}>
                <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <ShoppingCart size={11} style={{ color: C.blue }} />
                  <span className="text-xs font-bold" style={{ color: C.navy }}>Procurement</span>
                  <span className="text-[10px]" style={{ color: "#64748b" }}>{effMoqPlantData.length} orders</span>
                </div>
                <div className="flex flex-col divide-y" style={{ borderColor: "#f1f5f9" }}>
                  {effMoqPlantData.map((plant) => {
                    const supplier = plant.suppliers.find((s) => s.id === moqSuppliers[plant.id]) ?? plant.suppliers[0];
                    return (
                      <div
                        key={plant.id}
                        className="px-3 py-2 grid items-center gap-2"
                        style={{ borderColor: "#f1f5f9", gridTemplateColumns: "150px minmax(110px,1fr) 150px" }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-bold shrink-0" style={{ color: C.navy }}>{plant.plant}</span>
                          {materialBadge(plant.material)}
                        </div>
                        {isCustomising ? (
                          <select
                            value={supplier.id}
                            onChange={(e) => onMoqSupplier(plant.id, e.target.value)}
                            title={`Choose supplier for ${plant.plant}`}
                            className="text-xs rounded px-1.5 py-1 cursor-pointer justify-self-center"
                            style={{ ...editInputStyle, backgroundColor: "#fff", width: "100%", maxWidth: 180 }}
                          >
                            {plant.suppliers.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className="text-xs font-semibold truncate justify-self-center"
                            title={supplier.name}
                            style={{ color: C.blue, maxWidth: 180 }}
                          >
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
                                onChange={(e) => updateMoqOrderQty(plant.id, Number(e.target.value) || 0)}
                                className="w-14 text-center text-[10px] font-semibold tabular-nums rounded px-1 py-0.5"
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
        );
      })}
    </div>
  );
}
