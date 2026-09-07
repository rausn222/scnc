import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { C } from "../actionDetails/theme";
import { SCENARIOS } from "../sciDetails/constants";
import type { AcceptedScenarioDetails } from "../../App";

/** Placeholder until a real cost roll-up (transfer + procurement + write-off) is wired up. */
const TOTAL_COST_PLACEHOLDER = "₹8,900";

const HEADERS = [
  "Selected Scenario",
  "Business Waste",
  "Total Cost",
  "Total FG Cover / Max Production Stop Date",
  "Total Producible FG",
  "Deviations",
];

function wasteSavingsColor(wasteSavings: string | null | undefined) {
  const saved = parseFloat((wasteSavings ?? "").replace(/[₹,]/g, "")) || 0;
  const percentage = (saved / 5541) * 100;
  return percentage >= 40 ? C.teal : percentage >= 20 ? "#d97706" : "#dc2626";
}

interface Props {
  effectiveScenario?: AcceptedScenarioDetails;
  /** True when the page has no scenario from navigation, so the scenario cell is an
   * editable picker instead of static text. */
  isManualMode: boolean;
  manualScenarioId: string | null;
  onManualScenarioChange: (id: string) => void;
  deviations: string[];
  onResimulate: () => void;
}

export function TrackingOverviewSection({
  effectiveScenario,
  isManualMode,
  manualScenarioId,
  onManualScenarioChange,
  deviations,
  onResimulate,
}: Readonly<Props>) {
  const hasDeviations = deviations.length > 0;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="rounded-xl bg-white overflow-hidden"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer"
        style={{ color: C.navy }}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand overview" : "Collapse overview"}
      >
        <span className="text-xs font-bold uppercase tracking-wide">Overview</span>
        {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
      </button>
      {!collapsed && <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: "#94a3b8", minWidth: header === "Deviations" ? 160 : undefined }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 align-top">
                {isManualMode ? (
                  <select
                    value={manualScenarioId ?? ""}
                    onChange={(e) => onManualScenarioChange(e.target.value)}
                    title="Select scenario"
                    className="rounded-md px-2 py-1 text-xs"
                    style={{ border: "1px solid #d1d5db", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <option value="" disabled>Select scenario</option>
                    {SCENARIOS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold" style={{ color: C.navy }}>{effectiveScenario?.name ?? "—"}</span>
                )}
              </td>
              <td className="px-4 py-3 align-top text-xs font-bold whitespace-nowrap">
                <span style={{ color: effectiveScenario?.wasteColor === "teal" ? C.teal : "#dc2626" }}>
                  {effectiveScenario?.businessWaste ?? "—"}
                </span>
                {effectiveScenario?.wasteSavings && (
                  <span className="ml-1.5 font-semibold" style={{ color: wasteSavingsColor(effectiveScenario.wasteSavings), fontSize: 10 }}>
                    ↓ {effectiveScenario.wasteSavings}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 align-top text-xs font-bold whitespace-nowrap" style={{ color: C.navy }}>
                {effectiveScenario ? TOTAL_COST_PLACEHOLDER : "—"}
              </td>
              <td className="px-4 py-3 align-top">
                <p className="text-xs font-bold whitespace-nowrap" style={{ color: C.navy }}>{effectiveScenario?.fgDaysCover ?? "—"}</p>
                <p className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: "#64748b" }}>{effectiveScenario?.productionStopDate ?? "—"}</p>
              </td>
              <td className="px-4 py-3 align-top text-xs font-bold whitespace-nowrap" style={{ color: C.navy }}>
                {effectiveScenario ? effectiveScenario.feasibleProducible.toLocaleString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3 align-top">
                {!effectiveScenario ? (
                  <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                ) : hasDeviations ? (
                  <div className="flex flex-wrap gap-1">
                    {deviations.map((d) => (
                      <span
                        key={d}
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                  >
                    No deviations
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>}

      {!collapsed && effectiveScenario && (
        <div
          className="flex items-center justify-between gap-3 flex-wrap px-4 py-3"
          style={{ borderTop: "1px solid #f1f5f9", backgroundColor: hasDeviations ? "#fffbeb" : "#f8fafc" }}
        >
          <div className="flex items-start gap-2">
            {hasDeviations && <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "#b45309" }} />}
            <p className="text-xs" style={{ color: hasDeviations ? "#92400e" : "#64748b" }}>
              {hasDeviations
                ? "Resimulate to analyse impact of deviations on the scenario selected"
                : "No deviations detected — resimulation not required."}
            </p>
          </div>
          {hasDeviations && (
            <button
              type="button"
              onClick={onResimulate}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: C.navy }}
            >
              <RefreshCw size={12} />
              Resimulate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
