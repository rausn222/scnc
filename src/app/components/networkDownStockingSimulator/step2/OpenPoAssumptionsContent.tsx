import { useState } from "react";
import { Check, Info, X } from "lucide-react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { ToggleSwitch } from "../../sciDetails/ToggleSwitch";
import {
  C,
  EXPANDED_BREAKDOWN_HEADER_BG,
  OPEN_PO_CANCELLABLE_LINES,
  OPEN_PO_LINES,
  OPEN_PO_STATUS_STYLE,
  PM_BADGE,
  RM_BADGE,
  isOpenPoLineCancellable,
} from "../../sciDetails/constants";
import { addDaysIso, daysPastDue } from "../../sciDetails/utils";
import { TablePagination } from "../../nationalDashboard/TablePagination";

// Local one-off colors — no exact match in the shared C palette.
const INFO_BANNER_BORDER = "#bfdbfe";
const INFO_BANNER_TEXT = "#1e40af";

const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * Every PO line and its status are always visible on open — the cancel
 * toggle is the one functional gate: when off, every line is fixed/included
 * and the per-line include/exclude actions are disabled rather than hidden.
 * In-transit and partially delivered lines are always fixed regardless of
 * the toggle — stock already moving to the plant can't be pulled back.
 */
export function OpenPoAssumptionsContent({
  openPoCancel,
  poIncludedByLine,
  onToggleCancel,
  onSetLineIncluded,
  onBulkSetIncluded,
}: {
  openPoCancel: boolean;
  poIncludedByLine: Record<string, boolean>;
  onToggleCancel: (v: boolean) => void;
  onSetLineIncluded: (id: string, v: boolean) => void;
  onBulkSetIncluded: (v: boolean) => void;
}) {
  const totalQty = OPEN_PO_LINES.reduce((sum, l) => sum + l.qty, 0);
  const activeQty = OPEN_PO_LINES.reduce((sum, l) => {
    if (!isOpenPoLineCancellable(l.status)) return sum + l.qty;
    const included = !openPoCancel || poIncludedByLine[l.id];
    return included ? sum + l.qty : sum;
  }, 0);
  const includedCount =
    OPEN_PO_LINES.length -
    OPEN_PO_CANCELLABLE_LINES.length +
    OPEN_PO_CANCELLABLE_LINES.filter((l) => !openPoCancel || poIncludedByLine[l.id]).length;
  const rmCount = OPEN_PO_LINES.filter((l) => l.type === "RM").length;
  const pmCount = OPEN_PO_LINES.filter((l) => l.type === "PM").length;

  const allCancellableActivated = OPEN_PO_CANCELLABLE_LINES.every((l) => poIncludedByLine[l.id]);
  const allCancellableCancelled = OPEN_PO_CANCELLABLE_LINES.every((l) => !poIncludedByLine[l.id]);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = OPEN_PO_LINES.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedLines = OPEN_PO_LINES.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="px-6 py-5 space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3.5"
        style={{ backgroundColor: C.bgSlateLight }}
      >
        <p className="text-xs" style={{ color: C.muted }}>
          Allow open PO lines to be cancelled as part of the simulation.
        </p>
        <ToggleSwitch checked={openPoCancel} onChange={onToggleCancel} label="Open POs can be cancelled" />
      </div>

      {openPoCancel && (
        <div
          className="flex items-start gap-2.5 rounded-lg px-4 py-3"
          style={{ backgroundColor: EXPANDED_BREAKDOWN_HEADER_BG, border: `1px solid ${INFO_BANNER_BORDER}` }}
        >
          <Info size={14} style={{ color: PM_BADGE.color, marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: INFO_BANNER_TEXT }}>
            PO cancellation will be included as a part of action items
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span style={{ color: C.muted }}>
          {openPoCancel
            ? `${includedCount} of ${OPEN_PO_LINES.length} included — ${activeQty.toLocaleString("en-IN")} units active`
            : `${totalQty.toLocaleString("en-IN")} units fixed — cancellation not enabled`}
          {` — ${rmCount} RM · ${pmCount} PM`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!openPoCancel}
            title={openPoCancel ? "Activate all cancellable open PO lines" : "Enable cancellation to change activation"}
            className="flex text-xs items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
            style={{
              backgroundColor: allCancellableActivated ? C.successBg : C.bgSlate,
              color: allCancellableActivated ? C.successText : C.borderMuted,
              opacity: openPoCancel ? 1 : 0.5,
              cursor: openPoCancel ? "pointer" : "not-allowed",
            }}
            onClick={() => onBulkSetIncluded(true)}
          >
            <Check size={12} />
            Include all
          </button>
          <button
            type="button"
            disabled={!openPoCancel}
            title={openPoCancel ? "Cancel all cancellable open PO lines" : "Enable cancellation to change activation"}
            className="flex text-xs items-center gap-1 px-2.5 py-1 rounded-full font-semibold transition-colors"
            style={{
              backgroundColor: allCancellableCancelled ? C.dangerBg : C.bgSlate,
              color: allCancellableCancelled ? C.dangerDark : C.borderMuted,
              opacity: openPoCancel ? 1 : 0.5,
              cursor: openPoCancel ? "pointer" : "not-allowed",
            }}
            onClick={() => onBulkSetIncluded(false)}
          >
            <X size={12} />
            Cancel all
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {[
                "INCL.",
                "SITE CODE",
                "SITE CLUSTER",
                "MATERIAL",
                "VENDOR",
                "PO NUMBER",
                "OPEN PO QTY",
                "SUPPLIER INV.",
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
              const cancellable = isOpenPoLineCancellable(line.status);
              const effectivelyIncluded = !cancellable || !openPoCancel || poIncludedByLine[line.id];
              // Partially delivered stock is still moving to the plant, same as fully
              // in-transit stock — shown as "In Transit" here so the status column
              // reflects that shared meaning instead of splitting it out visually.
              const displayStatus = line.status === "Partially Delivered" ? "In Transit" : line.status;
              const statusStyle = OPEN_PO_STATUS_STYLE[displayStatus];
              const ageing = daysPastDue(line.poDeliveryDate);
              const checkboxTitle = !cancellable
                ? "In-transit POs cannot be cancelled."
                : openPoCancel
                  ? poIncludedByLine[line.id]
                    ? "Exclude this PO line"
                    : "Include this PO line"
                  : "Enable cancellation to change inclusion";

              return (
                <tr key={line.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={effectivelyIncluded}
                      disabled={!cancellable || !openPoCancel}
                      onChange={(e) => onSetLineIncluded(line.id, e.target.checked)}
                      title={checkboxTitle}
                      className="rounded"
                      style={{ cursor: !cancellable || !openPoCancel ? "not-allowed" : "pointer" }}
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
                  <td className="px-3 py-2.5" style={{ color: C.muted }}>
                    {(line.status === "Partially Delivered"
                      ? Math.round(line.qty / 2)
                      : line.supplierInventory
                    ).toLocaleString("en-IN")}
                  </td>
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
