import { AlertTriangle, Copy, CopyCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import {
  C,
  RM_BADGE,
  PM_BADGE,
  RMPM_BOM_PENDING_LIES_WITH,
  RMPM_CONNECTIVITY_STATUS_MESSAGE,
  type RmpmBomConnectivityRow,
  type RmpmBomPendingStatus,
} from "../../sciDetails/constants";
import { DateWeekEditor } from "../../sciDetails/step2/DateWeekEditor";

// Local one-off colors — no exact match in the shared C palette.
const ISSUE_TEXT_COLOR = "#b45309";
const NOT_AVAILABLE_TEXT_COLOR = "#b91c1c";

type BomGroup = {
  key: string;
  cbus: string[];
  plants: string[];
  bomPv: string;
  materialType: "RM" | "PM";
  materialCode: string;
  description: string;
  supplierCode: string;
  supplierName: string;
  contractStatus: RmpmBomConnectivityRow["contractStatus"];
  contractIssue?: string;
};

// Rows sharing the same material + supplier + contract state are clubbed into a
// single displayed row, combining their distinct CBU/Plant values into one cell —
// a contract issue belongs to the material/supplier pair, not to any one CBU/plant.
function groupBomRows(rows: RmpmBomConnectivityRow[]): BomGroup[] {
  const groups = new Map<string, BomGroup>();
  for (const row of rows) {
    const key = `${row.materialCode}::${row.supplierCode}::${row.contractStatus}::${row.contractIssue ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      if (!existing.cbus.includes(row.cbu)) existing.cbus.push(row.cbu);
      if (!existing.plants.includes(row.plant)) existing.plants.push(row.plant);
    } else {
      groups.set(key, {
        key,
        cbus: [row.cbu],
        plants: [row.plant],
        bomPv: row.bomPv,
        materialType: row.materialType,
        materialCode: row.materialCode,
        description: row.description,
        supplierCode: row.supplierCode,
        supplierName: row.supplierName,
        contractStatus: row.contractStatus,
        contractIssue: row.contractIssue,
      });
    }
  }
  return Array.from(groups.values());
}

function ContractAvailabilityCell({ group }: { group: BomGroup }) {
  if (group.contractStatus === "available") {
    return (
      <span className="font-semibold" style={{ color: C.successText }}>
        Contract available
      </span>
    );
  }
  if (group.contractStatus === "issue") {
    return (
      <span className="font-semibold" style={{ color: ISSUE_TEXT_COLOR }}>
        Contract available, with &ldquo;{group.contractIssue}&rdquo;
      </span>
    );
  }
  return (
    <span className="font-semibold" style={{ color: NOT_AVAILABLE_TEXT_COLOR }}>
      Contract not available
    </span>
  );
}

/**
 * Shown when a New CBU's BOM exists but its PO doesn't yet (contract_pending) or the
 * contract's in place and only the PO is pending with the factory (po_creation_pending) —
 * both statuses share this one BOM connectivity table, differing only in the banner copy
 * above it. Connectivity date is set per row (grouped by material+supplier+contract state),
 * with "copy to all" / "copy to same plant & CBU" to fan a date out to other rows quickly.
 */
export function RmpmBomPendingContent({
  rows,
  status,
}: {
  rows: RmpmBomConnectivityRow[];
  status: RmpmBomPendingStatus;
}) {
  const groups = useMemo(() => groupBomRows(rows), [rows]);
  const [dates, setDates] = useState<Record<string, string>>({});

  const handleDateChange = (key: string, date: string) => {
    setDates((prev) => ({ ...prev, [key]: date }));
  };

  const handleCopyToAll = (key: string) => {
    const date = dates[key] ?? "";
    setDates(Object.fromEntries(groups.map((g) => [g.key, date])));
  };

  const handleCopyToSamePlantCbu = (key: string) => {
    const source = groups.find((g) => g.key === key);
    if (!source) return;
    const date = dates[key] ?? "";
    setDates((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        const sharesPlant = g.plants.some((p) => source.plants.includes(p));
        const sharesCbu = g.cbus.some((c) => source.cbus.includes(c));
        if (sharesPlant && sharesCbu) next[g.key] = date;
      }
      return next;
    });
  };

  return (
    <div className="px-8 py-7 space-y-6">
      <div
        className="flex items-start gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}
      >
        <AlertTriangle size={16} style={{ color: C.warningText, marginTop: 1, flexShrink: 0 }} />
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: C.warningTextDark }}>
            {RMPM_BOM_PENDING_LIES_WITH[status]}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: C.warningTextDark }}>
            {RMPM_CONNECTIVITY_STATUS_MESSAGE[status]}
          </p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                {["CBU", "PLANT", "BOM PV", "MATERIAL", "SUPPLIER", "CONTRACT AVAILABILITY", "CONNECTIVITY DATE"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: C.white, fontSize: 9 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const badge = group.materialType === "RM" ? RM_BADGE : PM_BADGE;
                const date = dates[group.key] ?? "";
                return (
                  <tr key={group.key} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold" style={{ color: C.navy }}>
                      {group.cbus.join(", ")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>
                      {group.plants.join(", ")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: C.muted }}>
                      {group.bomPv}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {group.materialType}
                        </span>
                        <ComponentCodeWithDesc code={group.materialCode} description={group.description} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: C.navy }}>{group.supplierName}</div>
                      <div className="text-[10px]" style={{ color: C.borderMuted }}>{group.supplierCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ContractAvailabilityCell group={group} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DateWeekEditor
                          date={date}
                          onChange={(d) => handleDateChange(group.key, d)}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyToAll(group.key)}
                          title="Copy this date to every row"
                          className="shrink-0 cursor-pointer"
                        >
                          <Copy size={13} style={{ color: C.blue }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyToSamePlantCbu(group.key)}
                          title="Copy this date to rows with the same plant and CBU"
                          className="shrink-0 cursor-pointer"
                        >
                          <CopyCheck size={13} style={{ color: C.blue }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
