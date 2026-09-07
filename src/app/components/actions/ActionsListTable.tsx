import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { scenarioLabel, splitPlant, type ActionRow } from "./actionsData";
import { StatusDropdownCell } from "./StatusDropdownCell";
import { EmailActionCell } from "./EmailActionCell";

// ─── Theme — matches the source "Actions list" report table design. ─────────
const BORDER = "#e2e8f0";
const HEAD_BG = "#003087";

const COLS = [
  { label: "Action ID", width: 90, align: "left" as const },
  { label: "Network ID", width: 140, align: "left" as const },
  { label: "Scenario type", width: 120, align: "left" as const },
  { label: "Source plant", width: 100, align: "left" as const },
  { label: "Destination plant", width: 110, align: "left" as const },
  { label: "Material", width: 110, align: "left" as const },
  { label: "Quantity", width: 90, align: "right" as const },
  { label: "Description", width: 220, align: "left" as const },
  { label: "Owner", width: 170, align: "left" as const },
  { label: "SLA", width: 70, align: "right" as const },
  { label: "Ageing", width: 70, align: "right" as const },
  { label: "Status", width: 120, align: "left" as const },
  { label: "Action", width: 130, align: "left" as const },
];

interface Props {
  rows: ActionRow[];
  onDecision: (rowId: string, action: string) => void;
}

/**
 * Flat, one-row-per-action listing — every action gets its own line rather
 * than being nested under a collapsible scenario banner. Action ID is the
 * only unique column; Network ID and Scenario type intentionally repeat
 * across rows that share a network or scenario type. Owner/SLA/Ageing/
 * Status/Action reuse the same cells and mock data as the grouped table.
 */
export function ActionsListTable({ rows, onDecision }: Props) {
  if (rows.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-sm"
        style={{ color: "#6b7280", backgroundColor: "#fff", border: `1px solid ${BORDER}` }}
      >
        No actions match the selected filters.
      </div>
    );
  }

  return (
    <div className="actions-list-scroll h-full min-h-0 overflow-x-auto overflow-y-auto shadow-lg" style={{ border: "1px solid #d1d5db" }}>
      <table className="text-xs border-collapse w-full" style={{ minWidth: 1450 }}>
        <thead>
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white">
            {COLS.map((col, i) => (
              <th
                key={col.label}
                className={`px-3 py-2.5 font-semibold whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"} ${i === COLS.length - 1 ? "pr-6" : ""}`}
                style={{
                  borderRight: i < COLS.length - 1 ? "1px solid rgba(255,255,255,0.15)" : undefined,
                  position: "sticky",
                  top: 0,
                  zIndex: 21,
                  minWidth: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Fragment key={row.id}>
              <ActionListRow row={row} onDecision={onDecision} />
            </Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: HEAD_BG }} className="text-white font-semibold">
            <td colSpan={COLS.length} className="px-3 pr-6 py-2.5">
              TOTAL — {rows.length} action{rows.length === 1 ? "" : "s"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ActionListRow({
  row,
  onDecision,
}: {
  row: ActionRow;
  onDecision: (rowId: string, action: string) => void;
}) {
  const { source, destination } = splitPlant(row.plant);
  return (
    <tr style={{ backgroundColor: "#ffffff" }} className="hover:bg-blue-50 transition-colors">
      <td className="px-3 py-2.5 font-semibold whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#334155" }}>
        {row.actionId}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap font-semibold" style={{ borderRight: `1px solid ${BORDER}`, color: "#1565C0" }}>
        {row.networkId}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {scenarioLabel(row.scenarioType, row.seq)}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {source}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        <span className="inline-flex items-center gap-1">
          {destination !== "NA" && <ArrowRight size={11} style={{ color: "#9ca3af" }} />}
          {destination}
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.material}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.quantity}
      </td>
      <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}`, color: "#111827" }}>
        {row.description}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.owner}
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.slaHrs} hrs
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ borderRight: `1px solid ${BORDER}`, color: "#374151" }}>
        {row.ageingDays === null ? "—" : `${row.ageingDays}d`}
      </td>
      <td className="px-3 py-2.5" style={{ borderRight: `1px solid ${BORDER}` }}>
        <StatusDropdownCell row={row} onConfirm={onDecision} />
      </td>
      <td className="px-3 pr-6 py-2.5">
        <EmailActionCell row={row} />
      </td>
    </tr>
  );
}
