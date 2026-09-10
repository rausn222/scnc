import { useState } from "react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import {
  C,
  OPEN_PO_STATUS_STYLE,
  PM_BADGE,
  RM_BADGE,
} from "../../sciDetails/constants";
import { addDaysIso, daysPastDue } from "../../sciDetails/utils";
import { TablePagination } from "../../nationalDashboard/TablePagination";
import type { SimulationAssumptionsCatalog } from "../../../api/networkDownStockingSimulator/step2Api";

const DEFAULT_ROWS_PER_PAGE = 10;
// Caps the table's own scroll area so a large PO list scrolls internally
// instead of stretching the whole modal.
const TABLE_MAX_HEIGHT = "52vh";

/**
 * Every PO line and its status are always visible on open, and every line's
 * checkbox is independently selectable/deselectable — the planner opts each
 * one in via its checkbox or "Select all" in the header. All default unchecked.
 */
export function OpenPoAssumptionsContent({
  openPoLines,
  poIncludedByLine,
  onSetLineIncluded,
  onBulkSetIncluded,
}: {
  openPoLines: SimulationAssumptionsCatalog["openPoLines"];
  poIncludedByLine: Record<string, boolean>;
  onSetLineIncluded: (id: string, v: boolean) => void;
  onBulkSetIncluded: (v: boolean) => void;
}) {
  const totalQty = openPoLines.reduce((sum, l) => sum + l.qty, 0);
  const activeQty = openPoLines.reduce((sum, l) => (poIncludedByLine[l.id] ? sum + l.qty : sum), 0);
  const includedCount = openPoLines.filter((l) => poIncludedByLine[l.id]).length;
  const rmCount = openPoLines.filter((l) => l.type === "RM").length;
  const pmCount = openPoLines.filter((l) => l.type === "PM").length;

  const allActivated = openPoLines.every((l) => poIncludedByLine[l.id]);
  const allDeactivated = openPoLines.every((l) => !poIncludedByLine[l.id]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = openPoLines.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedLines = openPoLines.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span style={{ color: C.muted }}>
          {`${includedCount} of ${openPoLines.length} included — ${activeQty.toLocaleString("en-IN")} of ${totalQty.toLocaleString("en-IN")} units active`}
          {` — ${rmCount} RM · ${pmCount} PM`}
        </span>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-auto" style={{ maxHeight: TABLE_MAX_HEIGHT }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0" style={{ zIndex: 1 }}>
            <tr style={{ backgroundColor: C.navy }}>
              <th className="px-3 py-2.5 text-left" style={{ color: C.white, fontSize: 9 }}>
                <input
                  type="checkbox"
                  checked={allActivated}
                  ref={(el) => {
                    if (el) el.indeterminate = !allActivated && !allDeactivated;
                  }}
                  onChange={(e) => onBulkSetIncluded(e.target.checked)}
                  title="Select all open PO lines"
                  className="rounded cursor-pointer"
                />
              </th>
              {[
                "SITE CODE",
                "SITE CLUSTER",
                "MATERIAL",
                "VENDOR",
                "PO NUMBER",
                "OPEN PO QTY",
                "UOM",
                "DELIVERY DATE",
                "ETA",
                "AVG LT (DAYS)",
                "PO AGEING",
                "STATUS",
              ].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: C.white, fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedLines.map((line) => {
              // Partially delivered stock is still moving to the plant, same as fully
              // in-transit stock — shown as "In Transit" here so the status column
              // reflects that shared meaning instead of splitting it out visually.
              const displayStatus = line.status === "Partially Delivered" ? "In Transit" : line.status;
              const statusStyle = OPEN_PO_STATUS_STYLE[displayStatus];
              const ageing = daysPastDue(line.poDeliveryDate);
              const checkboxTitle = poIncludedByLine[line.id] ? "Exclude this PO line" : "Include this PO line";

              return (
                <tr key={line.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={!!poIncludedByLine[line.id]}
                      onChange={(e) => onSetLineIncluded(line.id, e.target.checked)}
                      title={checkboxTitle}
                      className="rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">{line.plant}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.siteCluster}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                        style={{
                          backgroundColor: line.type === "RM" ? RM_BADGE.bg : PM_BADGE.bg,
                          color: line.type === "RM" ? RM_BADGE.color : PM_BADGE.color,
                        }}
                      >
                        {line.type}
                      </span>
                      <ComponentCodeWithDesc code={line.componentCode} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{line.vendorName}</div>
                    <div className="text-[10px]" style={{ color: C.borderMuted }}>
                      {line.vendorId}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.poNumber}
                  </td>
                  <td className="px-3 py-2.5 font-bold">{line.qty.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2.5">{line.uom}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.poDeliveryDate}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {addDaysIso(line.poCreationDate, line.averageLeadTimeDays)}
                  </td>
                  <td className="px-3 py-2.5">{line.averageLeadTimeDays}</td>
                  <td
                    className="px-3 py-2.5 font-semibold"
                    style={{ color: ageing ? C.dangerDark : C.borderLight }}
                  >
                    {ageing ?? "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {displayStatus}
                    </span>
                  </td>
                </tr>
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
