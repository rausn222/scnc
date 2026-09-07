import { Star } from "lucide-react";
import { PLANT_CLUSTER_MAP } from "../../data";
import type { ScenarioRow, TransferScenarioId } from "../types";
import { ScenarioIcon } from "../ScenarioIcon";
import {
  C,
  TRANSFER_OPTION_BASE,
  TRANSFER_SCENARIO_CONFIG,
  RM_BADGE,
  PM_BADGE,
} from "../constants";

export function CompactScenarioCard({
  scenario,
  transferId,
}: {
  scenario: ScenarioRow;
  transferId: TransferScenarioId | null;
}) {
  const transfer = transferId
    ? { ...TRANSFER_OPTION_BASE, ...TRANSFER_SCENARIO_CONFIG[transferId] }
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col bg-white"
      style={{
        border: `1.5px solid ${scenario.isBest ? C.blue : "#e2e8f0"}`,
        boxShadow: scenario.isBest
          ? "0 4px 12px rgba(21,101,192,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2.5"
        style={{
          backgroundColor: scenario.isBest ? C.navy : "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <ScenarioIcon icon={scenario.icon} isAccepted={scenario.isBest} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-bold text-sm"
              style={{ color: scenario.isBest ? "#fff" : C.navy }}
            >
              {scenario.id.includes("iut") ? `Stock Transfer Options (IUT)` : scenario.name}
            </span>
            {scenario.isBest && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: C.green, color: "#fff" }}
              >
                <Star size={9} fill="currentColor" />
                Best
              </span>
            )}
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: scenario.isBest ? "rgba(255,255,255,0.6)" : "#64748b" }}
          >
            Next action: {scenario.nextAction}
          </p>
        </div>
      </div>

      {/* 2 × 2 metrics */}
      <div
        className="grid grid-cols-2 divide-x divide-y divide-[#f1f5f9]"
        style={{ borderBottom: transfer ? "1px solid #e2e8f0" : undefined }}
      >
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Business waste
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: scenario.wasteColor === "teal" ? C.teal : "#ea580c" }}>
            {scenario.businessWaste ?? "—"}
          </p>
          {scenario.wasteSavings && (
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: C.green }}>
              ↓ {scenario.wasteSavings} saved
            </p>
          )}
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            FG days cover
          </p>
          <p className="text-sm font-bold" style={{ color: C.navy }}>{scenario.fgDaysCover}</p>
          <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>
            {scenario.dailyRunRate.toLocaleString("en-IN")} units/day
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Feasible producible
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: C.navy }}>
            {scenario.feasibleProducible.toLocaleString("en-IN")} EA
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8" }}>
            Production stop
          </p>
          <p className="text-sm font-bold" style={{ color: C.navy }}>
            {scenario.productionStopDate}
          </p>
        </div>
      </div>

      {/* Transfer summary — compact inline */}
      {transfer && (
        <div className="px-4 py-2.5 space-y-1" style={{ backgroundColor: "#f8fafc" }}>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            LP Optimal Transfer
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span
              className="px-1 py-0.5 rounded text-[9px] font-bold"
              style={{
                backgroundColor: transfer.componentType === "RM" ? RM_BADGE.bg : PM_BADGE.bg,
                color: transfer.componentType === "RM" ? RM_BADGE.color : PM_BADGE.color,
              }}
            >
              {transfer.componentType}
            </span>
            <span className="font-semibold" style={{ color: C.navy }}>{transfer.componentCode}</span>
            <span style={{ color: "#64748b" }}>
              {transfer.routeFrom}
              {PLANT_CLUSTER_MAP[transfer.routeFrom] ? ` (${PLANT_CLUSTER_MAP[transfer.routeFrom]})` : ""}
              {" → "}
              {transfer.routeTo}
              {PLANT_CLUSTER_MAP[transfer.routeTo] ? ` (${PLANT_CLUSTER_MAP[transfer.routeTo]})` : ""}
            </span>
            <span className="font-medium" style={{ color: "#374151" }}>
              {transfer.transferQty.toLocaleString("en-IN")} EA
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: "#64748b" }}>
            <span>
              {transfer.wasteBeforeLabel}{" "}
              <span className="font-semibold" style={{ color: "#991b1b" }}>
                ₹{transfer.wasteBefore.toLocaleString("en-IN")}
              </span>
            </span>
            <span>→</span>
            <span>
              {transfer.wasteAfterLabel}{" "}
              <span className="font-semibold" style={{ color: "#c2410c" }}>
                ₹{transfer.wasteAfter.toLocaleString("en-IN")}
              </span>
            </span>
            <span>
              · Saved{" "}
              <span className="font-semibold" style={{ color: C.green }}>
                ₹{transfer.saved.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
