import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import {
  C,
  EXPANDED_BREAKDOWN_HEADER_BG,
  RM_BADGE,
  PM_BADGE,
} from "../../sciDetails/constants";
import { occurrenceConfidenceMeta } from "../../sciDetails/utils";
import { PLANT_CLUSTER_MAP } from "../../data";
import { TablePagination } from "../../nationalDashboard/TablePagination";
import { getMaterialBatchKey } from "../../../api/networkDownStockingSimulator/step2Api";
import type {
  MaterialBatchRow,
  SimulationAssumptionsCatalog,
} from "../../../api/networkDownStockingSimulator/step2Api";

export type { MaterialBatchRow };
export { getMaterialBatchKey };

// Local one-off color — no exact match in the shared C palette.
const CHECKBOX_ACCENT_COLOR = "#1769c2";
// Business rules for the two "days" inputs below.
const MAX_CONTRACT_LEAD_TIME_DAYS = 300;
const MAX_SHELF_LIFE_THRESHOLD_DAYS = 30;
const DEFAULT_ROWS_PER_PAGE = 10;
// Transfer route, Material, [Pre-IUT lead time, Transit time, Shelf-life threshold,
// Total lead time], Confidence, Possible.
const TOTAL_COLUMNS = 8;

const SHELF_LIFE_THRESHOLD_HELP = "Minimum shelf life for material to be considered for IUT";
const POSSIBLE_HELP = "Whether this lane is feasible for IUT, based on lead time, shelf life and contract terms for the materials involved";

function parseDaysLabel(label: string): number {
  const n = parseInt(label, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Compact lane label sized to match the table's own text-xs baseline — PlantRouteLabel
 * itself runs larger (text-sm) for use outside tables, so it isn't reused here. */
function LaneCell({ from, to }: { from: string; to: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold" style={{ color: C.blue }}>{from}</span>
      <span className="ml-1" style={{ color: C.muted }}>({PLANT_CLUSTER_MAP[from] ?? from})</span>
      <span className="mx-1.5" style={{ color: C.borderMuted }}>→</span>
      <span className="font-semibold" style={{ color: C.blue }}>{to}</span>
      <span className="ml-1" style={{ color: C.muted }}>({PLANT_CLUSTER_MAP[to] ?? to})</span>
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
  iutTransferLanes,
  iutLaneRequirements,
  materialBatchData,
  iutLanes,
  onTogglePossible,
  contractLeadTimes = {},
  onContractLeadTimeChange,
  batchThresholds = {},
  onBatchThresholdChange,
  selectedBatches = {},
  onBatchToggle,
}: {
  iutTransferLanes: SimulationAssumptionsCatalog["iutTransferLanes"];
  iutLaneRequirements: SimulationAssumptionsCatalog["iutLaneRequirements"];
  materialBatchData: MaterialBatchRow[];
  iutLanes: Record<string, boolean>;
  onTogglePossible: (laneKey: string) => void;
  contractLeadTimes?: Record<string, string>;
  onContractLeadTimeChange: (laneKey: string, value: string) => void;
  batchThresholds?: Record<string, string>;
  onBatchThresholdChange?: (materialCode: string, value: string) => void;
  selectedBatches?: Record<string, boolean>;
  onBatchToggle?: (batchKey: string) => void;
}) {
  // Keyed by laneKey — expanding a lane reveals batch details for every
  // material in that lane's requirement list, not just one material at a time.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const totalRows = iutTransferLanes.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedLanes = iutTransferLanes.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="px-6 py-5">
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              <th rowSpan={2} className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap align-bottom" style={{ color: C.white, fontSize: 9 }}>
                TRANSFER ROUTE
              </th>
              <th rowSpan={2} className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap align-bottom" style={{ color: C.white, fontSize: 9 }}>
                MATERIAL
              </th>
              <th colSpan={4} className="px-3 py-1.5 text-center font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.white, fontSize: 9, borderBottom: "1px solid rgba(255,255,255,0.25)" }}>
                LEAD TIME
              </th>
              <th rowSpan={2} className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap align-bottom" style={{ color: C.white, fontSize: 9 }}>
                CONFIDENCE
              </th>
              <th
                rowSpan={2}
                className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap align-bottom"
                style={{ color: C.white, fontSize: 9 }}
                title={POSSIBLE_HELP}
              >
                POSSIBLE
              </th>
            </tr>
            <tr style={{ backgroundColor: C.navy }}>
              <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.white, fontSize: 9 }}>
                PRE-IUT LEAD TIME
              </th>
              <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.white, fontSize: 9 }}>
                TRANSIT TIME
              </th>
              <th
                className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                style={{ color: C.white, fontSize: 9 }}
                title={SHELF_LIFE_THRESHOLD_HELP}
              >
                SHELF-LIFE THRESHOLD
              </th>
              <th className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: C.white, fontSize: 9 }}>
                TOTAL LEAD TIME
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedLanes.map((lane) => {
              const laneKey = `${lane.from}→${lane.to}`;
              const possible = iutLanes[laneKey];
              const materials = (iutLaneRequirements[laneKey] ?? []).filter(
                (m) => m.type === lane.keepType,
              );
              const materialsWithBatches = materials
                .map((mat) => ({ mat, batchRows: materialBatchData.filter((b) => b.materialCode === mat.code) }))
                .filter(({ batchRows }) => batchRows.length > 0);
              const hasLaneBatches = materialsWithBatches.length > 0;
              const isExpanded = hasLaneBatches && (expanded[laneKey] ?? false);
              const preIutDays = parseDaysLabel(contractLeadTimes[laneKey] ?? "7");
              const transitDays = parseDaysLabel(lane.transitTime);

              return (
                <Fragment key={laneKey}>
                <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {hasLaneBatches && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [laneKey]: !prev[laneKey] }))}
                          title={`${isExpanded ? "Collapse" : "Expand"} batch details for ${lane.from} → ${lane.to}`}
                          className="shrink-0 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown size={13} style={{ color: C.blue }} />
                          ) : (
                            <ChevronRight size={13} style={{ color: C.blue }} />
                          )}
                        </button>
                      )}
                      <LaneCell from={lane.from} to={lane.to} />
                    </div>
                  </td>

                  {materials.length === 0 ? (
                    <td colSpan={1} className="px-3 py-2.5 italic" style={{ color: C.borderMuted }}>
                      No RM/PM requirements for this lane
                    </td>
                  ) : (
                    <td className="px-3 py-2.5">
                      <div className="space-y-2.5">
                        {materials.map((mat) => (
                          <div key={mat.code} className="flex items-center gap-1.5">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                              style={{ backgroundColor: mat.type === "RM" ? RM_BADGE.bg : PM_BADGE.bg, color: mat.type === "RM" ? RM_BADGE.color : PM_BADGE.color }}
                            >
                              {mat.type}
                            </span>
                            <ComponentCodeWithDesc code={mat.code} description={mat.description} />
                          </div>
                        ))}
                      </div>
                    </td>
                  )}

                  <td className="px-3 py-2.5">
                    <div className="relative w-24">
                      <input
                        type="number"
                        min={0}
                        max={MAX_CONTRACT_LEAD_TIME_DAYS}
                        maxLength={3}
                        value={contractLeadTimes[laneKey] ?? "7"}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || Number(value) >= 0) {
                            onContractLeadTimeChange(laneKey, value);
                          }
                        }}
                        className="w-full rounded-md border border-slate-300 pl-2 pr-8 py-1 text-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        days
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold whitespace-nowrap" style={{ color: C.navy }}>
                      {lane.transitTime}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-2.5">
                      {materials.length === 0 ? (
                        <span style={{ color: C.borderMuted }}>—</span>
                      ) : (
                        materials.map((mat) => {
                          const hasBatches = materialBatchData.some((b) => b.materialCode === mat.code);
                          if (!hasBatches) {
                            return (
                              <div key={mat.code} className="h-[26px] flex items-center" style={{ color: C.borderLight }}>
                                —
                              </div>
                            );
                          }
                          return (
                            <div key={mat.code} className="relative w-24">
                              <input
                                type="number"
                                min={0}
                                max={MAX_SHELF_LIFE_THRESHOLD_DAYS}
                                step={1}
                                value={batchThresholds[mat.code] ?? "7"}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || (Number(value) >= 0 && Number(value) <= MAX_SHELF_LIFE_THRESHOLD_DAYS)) {
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
                    <div className="space-y-2.5">
                      {materials.length === 0 ? (
                        <span style={{ color: C.borderMuted }}>—</span>
                      ) : (
                        materials.map((mat) => {
                          const hasBatches = materialBatchData.some((b) => b.materialCode === mat.code);
                          if (!hasBatches) {
                            return (
                              <div key={mat.code} className="h-[26px] flex items-center" style={{ color: C.borderLight }}>
                                —
                              </div>
                            );
                          }
                          const shelfDays = parseDaysLabel(batchThresholds[mat.code] ?? "7");
                          return (
                            <div key={mat.code} className="h-[26px] flex items-center font-semibold whitespace-nowrap" style={{ color: C.navy }}>
                              {preIutDays + transitDays + shelfDays} days
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      className="font-bold tabular-nums whitespace-nowrap"
                      style={{ color: occurrenceConfidenceMeta(lane.iutOccurrences12mo).color }}
                    >
                      {lane.iutOccurrences12mo} times
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
                        style={{ backgroundColor: possible ? C.green : C.borderLight }}
                      >
                        <span
                          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                          style={{ left: possible ? 17 : 2 }}
                        />
                      </button>
                      <span
                        className="text-xs font-semibold whitespace-nowrap"
                        style={{ color: possible ? C.green : C.borderMuted }}
                      >
                        {possible ? "Possible" : "Not possible"}
                      </span>
                    </label>
                  </td>
                </tr>

                {isExpanded && (
                  <tr style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                    <td colSpan={TOTAL_COLUMNS} className="px-3 pb-3 pt-0" style={{ backgroundColor: C.bgSlateLight }}>
                      <div className="ml-[22px] rounded-lg bg-white overflow-hidden" style={{ border: "1px solid rgba(21,101,192,0.12)" }}>
                        <table className="text-[11px] w-full">
                          <thead>
                            <tr style={{ backgroundColor: EXPANDED_BREAKDOWN_HEADER_BG }}>
                              <th className="w-10 px-4 py-1.5" />
                              <th
                                className="px-4 py-1.5 text-left font-bold uppercase tracking-wide"
                                style={{ color: C.muted, fontSize: 9 }}
                              >
                                Material
                              </th>
                              <th
                                className="px-4 py-1.5 text-left font-bold uppercase tracking-wide"
                                style={{ color: C.muted, fontSize: 9 }}
                              >
                                Plant
                              </th>
                              <th
                                className="px-4 py-1.5 text-left font-bold uppercase tracking-wide"
                                style={{ color: C.muted, fontSize: 9 }}
                              >
                                Batch Number
                              </th>
                              <th
                                className="px-4 py-1.5 text-left font-bold uppercase tracking-wide"
                                style={{ color: C.muted, fontSize: 9 }}
                              >
                                Expiry Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {materialsWithBatches.flatMap(({ mat, batchRows }) =>
                              batchRows.map((batch) => {
                                const batchKey = getMaterialBatchKey(batch);
                                return (
                                  <tr key={batchKey} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                                    <td className="px-4 py-1.5">
                                      <input
                                        type="checkbox"
                                        checked={selectedBatches[batchKey] ?? true}
                                        onChange={() => onBatchToggle?.(batchKey)}
                                        className="h-3.5 w-3.5"
                                        style={{ accentColor: CHECKBOX_ACCENT_COLOR }}
                                      />
                                    </td>
                                    <td className="px-4 py-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                                          style={{ backgroundColor: mat.type === "RM" ? RM_BADGE.bg : PM_BADGE.bg, color: mat.type === "RM" ? RM_BADGE.color : PM_BADGE.color }}
                                        >
                                          {mat.type}
                                        </span>
                                        <ComponentCodeWithDesc code={mat.code} description={mat.description} className="text-[11px]" />
                                      </div>
                                    </td>
                                    <td className="px-4 py-1.5 font-semibold whitespace-nowrap" style={{ color: C.blue }}>
                                      {batch.plant}
                                    </td>
                                    <td className="px-4 py-1.5 tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                                      {batch.batchNumber}
                                    </td>
                                    <td className="px-4 py-1.5 tabular-nums whitespace-nowrap" style={{ color: C.borderMuted }}>
                                      {batch.expiryDate}
                                    </td>
                                  </tr>
                                );
                              }),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
        {totalRows > rowsPerPage && (
          <TablePagination
            page={safePage}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </div>
    </div>
  );
}
