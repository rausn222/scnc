import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, IUT_TRANSFER_LANES, IUT_LANE_REQUIREMENTS, RM_BADGE, PM_BADGE } from "../../sciDetails/constants";
import { confidenceMeta } from "../../sciDetails/utils";
import { PLANT_CLUSTER_MAP } from "../../data";

export type MaterialBatchRow = {
  plant: string;
  materialType: "RM" | "PM";
  materialCode: string;
  batchNumber: string;
  expiryDate: string;
};

/**
 * Batch-level detail shown behind a lane material's expand/collapse toggle
 * below. Keyed by the same material codes each lane actually keeps after
 * its RM/PM filter — 65428959 (PM) on U535→UTR, 64322546 (RM) on UTR→U535 —
 * one batch per plant on that lane so both endpoints are checkable.
 */
export const MATERIAL_BATCH_DATA: MaterialBatchRow[] = [
  {
    plant: "U535",
    materialType: "PM",
    materialCode: "65428959",
    batchNumber: "0009843159",
    expiryDate: "19-09-2026",
  },
  {
    plant: "UTR",
    materialType: "PM",
    materialCode: "65428959",
    batchNumber: "0009843160",
    expiryDate: "29-09-2026",
  },
  {
    plant: "UTR",
    materialType: "RM",
    materialCode: "64322546",
    batchNumber: "0009843161",
    expiryDate: "18-09-2026",
  },
];

export function getMaterialBatchKey(row: MaterialBatchRow) {
  return `${row.materialCode}-${row.plant}-${row.batchNumber}`;
}

const SHELF_LIFE_THRESHOLD_HELP = "Minimum shelf life for material to be considered for IUT";

/** Compact lane label sized to match the table's own text-xs baseline — PlantRouteLabel
 * itself runs larger (text-sm) for use outside tables, so it isn't reused here. */
function LaneCell({ from, to }: { from: string; to: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold" style={{ color: C.blue }}>{from}</span>
      <span className="ml-1" style={{ color: "#64748b" }}>({PLANT_CLUSTER_MAP[from] ?? from})</span>
      <span className="mx-1.5" style={{ color: "#94a3b8" }}>→</span>
      <span className="font-semibold" style={{ color: C.blue }}>{to}</span>
      <span className="ml-1" style={{ color: "#64748b" }}>({PLANT_CLUSTER_MAP[to] ?? to})</span>
    </span>
  );
}

/**
 * Every lane's RM/PM requirement is shown up front. A material with recorded
 * batch data gets an expand/collapse chevron revealing its batches — each
 * with a checkbox, plant, batch number and expiry date — so a batch can be
 * excluded from the transfer without leaving the table. The Possible/Not
 * possible switch is otherwise the only other interactive action.
 */
export function IutFeasibilityContent({
  iutLanes,
  onTogglePossible,
  contractLeadTimes = {},
  onContractLeadTimeChange,
  batchThresholds = {},
  onBatchThresholdChange,
  selectedBatches = {},
  onBatchToggle,
}: {
  iutLanes: Record<string, boolean>;
  onTogglePossible: (laneKey: string) => void;
  contractLeadTimes?: Record<string, string>;
  onContractLeadTimeChange: (laneKey: string, value: string) => void;
  batchThresholds?: Record<string, string>;
  onBatchThresholdChange?: (materialCode: string, value: string) => void;
  selectedBatches?: Record<string, boolean>;
  onBatchToggle?: (batchKey: string) => void;
}) {
  // Keyed by `${laneKey}::${materialCode}` — a material with batch data only
  // ever appears in one lane's requirement list today, but this keeps a
  // lane's expand state independent if that ever changes.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="px-6 py-5">
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {["TRANSFER ROUTE", "MATERIAL", "TRANSIT TIME", "ADDITIONAL LEAD TIME", "SHELF-LIFE THRESHOLD", "CONFIDENCE", "POSSIBLE"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "#ffffff", fontSize: 9 }}
                  title={h === "SHELF-LIFE THRESHOLD" ? SHELF_LIFE_THRESHOLD_HELP : undefined}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IUT_TRANSFER_LANES.map((lane) => {
              const laneKey = `${lane.from}→${lane.to}`;
              const possible = iutLanes[laneKey];
              const materials = (IUT_LANE_REQUIREMENTS[laneKey] ?? []).filter(
                (m) => m.type === lane.keepType,
              );

              return (
                <tr key={laneKey} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-2.5">
                    <LaneCell from={lane.from} to={lane.to} />
                  </td>

                  {materials.length === 0 ? (
                    <td colSpan={1} className="px-3 py-2.5 italic" style={{ color: "#94a3b8" }}>
                      No RM/PM requirements for this lane
                    </td>
                  ) : (
                    <td className="px-3 py-2.5">
                      <div className="space-y-2.5">
                        {materials.map((mat) => {
                          const batchRows = MATERIAL_BATCH_DATA.filter((b) => b.materialCode === mat.code);
                          const hasBatches = batchRows.length > 0;
                          const expandKey = `${laneKey}::${mat.code}`;
                          const isExpanded = hasBatches && (expanded[expandKey] ?? false);

                          return (
                            <div key={mat.code}>
                              <div className="flex items-center gap-1.5">
                                {hasBatches && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpanded((prev) => ({ ...prev, [expandKey]: !prev[expandKey] }))
                                    }
                                    title={`${isExpanded ? "Collapse" : "Expand"} batch details for ${mat.code}`}
                                    className="shrink-0 cursor-pointer self-center"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown size={13} style={{ color: C.blue }} />
                                    ) : (
                                      <ChevronRight size={13} style={{ color: C.blue }} />
                                    )}
                                  </button>
                                )}
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: mat.type === "RM" ? RM_BADGE.bg : PM_BADGE.bg, color: mat.type === "RM" ? RM_BADGE.color : PM_BADGE.color }}
                                >
                                  {mat.type}
                                </span>
                                <ComponentCodeWithDesc code={mat.code} description={mat.description} />
                              </div>

                              {isExpanded && (
                                <div
                                  className="mt-1.5 ml-[18px] rounded-lg bg-white overflow-hidden divide-y divide-slate-100"
                                  style={{ border: "1px solid rgba(21,101,192,0.12)" }}
                                >
                                  {batchRows.map((batch) => {
                                    const batchKey = getMaterialBatchKey(batch);
                                    return (
                                      <label
                                        key={batchKey}
                                        className="flex items-start gap-2 px-2.5 py-1.5 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedBatches[batchKey] ?? true}
                                          onChange={() => onBatchToggle?.(batchKey)}
                                          className="mt-0.5 h-3.5 w-3.5 accent-[#1769c2] shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px]">
                                            <span className="font-semibold" style={{ color: C.blue }}>
                                              {batch.plant}
                                            </span>
                                            <span className="tabular-nums" style={{ color: C.navy }}>
                                              Batch {batch.batchNumber}
                                            </span>
                                          </div>
                                          <div className="tabular-nums whitespace-nowrap text-[11px]" style={{ color: "#94a3b8" }}>
                                            Expires {batch.expiryDate}
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  )}

                  <td className="px-3 py-2.5">
                    <span className="font-semibold whitespace-nowrap" style={{ color: C.navy }}>
                      {lane.transitTime}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="relative w-24">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        maxLength={3}
                        value={contractLeadTimes[laneKey] ?? "3"}
                        onChange={(e) =>
                          onContractLeadTimeChange(laneKey, e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 pl-2 pr-8 py-1 text-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        days
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-2.5">
                      {materials.length === 0 ? (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      ) : (
                        materials.map((mat) => {
                          const hasBatches = MATERIAL_BATCH_DATA.some((b) => b.materialCode === mat.code);
                          if (!hasBatches) {
                            return (
                              <div key={mat.code} className="h-[26px] flex items-center" style={{ color: "#cbd5e1" }}>
                                —
                              </div>
                            );
                          }
                          return (
                            <div key={mat.code} className="relative w-24">
                              <input
                                type="number"
                                min={0}
                                max={30}
                                step={1}
                                value={batchThresholds[mat.code] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || Number(value) <= 30) {
                                    onBatchThresholdChange?.(mat.code, value);
                                  }
                                }}
                                aria-label={`Shelf-life threshold for material ${mat.code}. ${SHELF_LIFE_THRESHOLD_HELP}`}
                                className="w-full rounded-md border border-slate-300 pl-2 pr-8 py-1 text-xs"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                                days
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      className="font-bold tabular-nums whitespace-nowrap"
                      style={{ color: confidenceMeta(lane.confidenceScore).color }}
                    >
                      {lane.confidenceScore}%
                    </span>
                  </td>

                  <td className="px-3 py-2.5">
                    {/* Fixed width regardless of state — "Possible"/"Not possible" differ in
                        length, and an auto-sized label here reflows the whole table (and the
                        modal around it) on every toggle. */}
                    <label className="flex items-center gap-2 cursor-pointer" style={{ width: 108 }}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={possible}
                        onClick={() => onTogglePossible(laneKey)}
                        title={`Mark ${lane.from} → ${lane.to} as ${possible ? "not possible" : "possible"}`}
                        className="relative w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0"
                        style={{ backgroundColor: possible ? C.green : "#cbd5e1" }}
                      >
                        <span
                          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                          style={{ left: possible ? 17 : 2 }}
                        />
                      </button>
                      <span
                        className="text-xs font-semibold whitespace-nowrap"
                        style={{ color: possible ? C.green : "#94a3b8" }}
                      >
                        {possible ? "Possible" : "Not possible"}
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
