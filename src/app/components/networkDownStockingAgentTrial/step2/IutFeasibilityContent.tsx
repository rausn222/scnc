import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, IUT_TRANSFER_LANES, IUT_LANE_REQUIREMENTS, RM_BADGE, PM_BADGE } from "../../sciDetails/constants";
import { confidenceMeta } from "../../sciDetails/utils";
import { PLANT_CLUSTER_MAP } from "../../data";

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
 * Every lane's RM/PM requirement is shown up front — no expand/collapse.
 * Only the Possible/Not possible switch is an interactive action.
 */
export function IutFeasibilityContent({
  iutLanes,
  onTogglePossible,
  contractLeadTimes = {},
  onContractLeadTimeChange,
  thresholds = {},
  onThresholdChange,
}: {
  iutLanes: Record<string, boolean>;
  onTogglePossible: (laneKey: string) => void;
  contractLeadTimes?: Record<string, string>;
  onContractLeadTimeChange: (laneKey: string, value: string) => void;
  thresholds?: Record<string, string>;
  onThresholdChange?: (laneKey: string, value: string) => void;
}) {
  return (
    <div className="px-6 py-5">
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {["TRANSFER ROUTE", "RM/PM", "MATERIAL", "TRANSIT TIME", "ADDITIONAL LEAD TIME", "THRESHOLD", "CONFIDENCE", "POSSIBLE"].map((h) => (
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
                    <td colSpan={3} className="px-3 py-2.5 italic" style={{ color: "#94a3b8" }}>
                      No RM/PM requirements for this lane
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2.5">
                        <div className="space-y-2.5">
                          {materials.map((mat) => (
                            <span
                              key={mat.code}
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{ backgroundColor: mat.type === "RM" ? RM_BADGE.bg : PM_BADGE.bg, color: mat.type === "RM" ? RM_BADGE.color : PM_BADGE.color }}
                            >
                              {mat.type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-2.5">
                          {materials.map((mat) => (
                            <ComponentCodeWithDesc key={mat.code} code={mat.code} description={mat.description} />
                          ))}
                        </div>
                      </td>
                    </>
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
                    <div className="relative w-24">
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={thresholds[laneKey] ?? ""}
                        onChange={(e) =>
                          onThresholdChange(laneKey, e.target.value)
                        }
                        className="w-full rounded-md border border-slate-300 pl-2 pr-8 py-1 text-xs"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                        days
                      </span>
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
