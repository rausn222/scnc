import React, { useMemo, useState } from "react";
import { Calendar, Search, X } from "lucide-react";
import type { ScenarioRow } from "../types";
import {
  C,
  SCENARIOS,
  COMP_BREAKDOWN_ROWS,
  PM_BADGE,
  RM_BADGE,
  SITE_PRODUCTION_STOP_DATES,
  SCENARIO_COMP_VALUES,
} from "../constants";
import { getProductionWeekEndDate } from "../utils";

export function ScenarioComparisonPanel({
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
                  colSpan={3}
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
                    Business Waste
                    <div className="text-[8px] font-normal normal-case tracking-normal mt-0.5" style={{ color: "#94a3b8" }}>₹</div>
                  </th>
                  <th
                    className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-wide"
                    style={{ color: "#64748b" }}
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
                  colSpan={FIXED_COLS + scenarios.length * 3}
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
                          colSpan={3}
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
                              <td className="px-2 py-2.5 text-center align-top" style={{ borderLeft: "2px solid #e2e8f0" }}>
                                <div className="flex flex-col items-center gap-0.5">
                                  <span
                                    className="tabular-nums font-semibold text-xs"
                                    style={{ color: s.wasteColor === "teal" ? C.teal : "#dc2626" }}
                                  >
                                    {s.businessWaste ?? "—"}
                                  </span>
                                  {s.wasteSavings && (
                                    <span className="tabular-nums text-[10px] font-medium" style={{ color: C.teal }}>
                                      ↓ {s.wasteSavings}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-center tabular-nums font-semibold text-xs" style={{ color: "#374151" }}>
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
