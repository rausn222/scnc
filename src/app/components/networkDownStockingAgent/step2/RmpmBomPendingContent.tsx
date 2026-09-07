import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import {
  type AggregatedComponent,
  type CBURow,
  getAggregatedComponents,
  getComponentDescription,
  getRowFgMaterial,
} from "../../data";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { AssumptionDateInput } from "../../sciDetails/AssumptionDateInput";
import {
  C,
  RM_BADGE,
  PM_BADGE,
  RMPM_BOM_PENDING_LIES_WITH,
  RMPM_CONNECTIVITY_STATUS_MESSAGE,
  type RmpmBomPendingStatus,
} from "../../sciDetails/constants";

function materialType(comp: AggregatedComponent): "RM" | "PM" {
  return comp.componentMaterialType === "1002" ? "RM" : "PM";
}

/**
 * Shown when a New CBU's BOM exists but its PO doesn't yet — the RMPM date has
 * to be entered manually, so this surfaces the BOM (all it has to go on) plus
 * who the delay currently sits with, alongside the manual date field.
 */
export function RmpmBomPendingContent({
  newCbuRow,
  status,
  date,
  onDateChange,
}: {
  newCbuRow: CBURow;
  status: RmpmBomPendingStatus;
  date: string;
  onDateChange: (date: string) => void;
}) {
  const components = useMemo(() => {
    const fgMaterial = getRowFgMaterial(newCbuRow);
    return getAggregatedComponents(newCbuRow.cbuCode, fgMaterial);
  }, [newCbuRow]);

  return (
    <div className="px-8 py-7 space-y-6">
      <div
        className="flex items-start gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a" }}
      >
        <AlertTriangle size={16} style={{ color: "#b45309", marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: "#92400e" }}>
            {RMPM_BOM_PENDING_LIES_WITH[status]}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
            {RMPM_CONNECTIVITY_STATUS_MESSAGE[status]}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold mb-1" style={{ color: C.navy }}>
          Bill of materials
        </p>
        <p className="text-xs mb-3" style={{ color: "#64748b" }}>
          The BOM is available for this CBU even though the PO hasn't been raised yet.
        </p>
        <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                {["TYPE", "MATERIAL", "ON-HAND STOCK", "OPEN QTY STOCK"].map((h, i, arr) => (
                  <th
                    key={h}
                    className={`py-4 font-bold uppercase tracking-wide whitespace-nowrap ${
                      i === 0 ? "pl-6 pr-5" : i === arr.length - 1 ? "pl-5 pr-8" : "px-5"
                    } ${[2, 3].includes(i) ? "text-center" : "text-left"}`}
                    style={{ color: "#ffffff", fontSize: 9 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {components.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-xs" style={{ color: "#64748b" }}>
                    No BOM components found for this CBU.
                  </td>
                </tr>
              ) : (
                components.map((comp) => {
                  const type = materialType(comp);
                  const badge = type === "RM" ? RM_BADGE : PM_BADGE;
                  return (
                    <tr key={comp.componentCode} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="pl-6 pr-5 py-4">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ComponentCodeWithDesc code={comp.componentCode} description={getComponentDescription(comp)} />
                      </td>
                      <td className="px-5 py-4 text-center font-bold tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                        {comp.totalStock.toLocaleString("en-IN")}
                      </td>
                      <td className="pl-5 pr-8 py-4 text-center tabular-nums whitespace-nowrap" style={{ color: "#64748b" }}>
                        {comp.openPOStock.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold mb-1" style={{ color: C.navy }}>
          Network planner's target connectivity date
        </p>
        <p className="text-xs mb-3" style={{ color: "#64748b" }}>
          No PO-derived date is available yet — set a target date so downstream planning isn't blocked while this is resolved. Update it once the actual PO date is known.
        </p>
        <AssumptionDateInput value={date} onChange={onDateChange} />
      </div>
    </div>
  );
}
