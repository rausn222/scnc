import { useEffect, useMemo, useState } from "react";
import type { OpenPoAssumptionLine } from "../../sciDetails/types";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, OPEN_PO_STATUS_STYLE, type OpenPoStatus } from "../../sciDetails/constants";
import { daysPastDue } from "../../sciDetails/utils";
import { DateWeekEditor } from "../../sciDetails/step2/DateWeekEditor";
import { TablePagination } from "../../nationalDashboard/TablePagination";

// Illustrative status per open PO line — cycled by row since individual PO
// status isn't tracked on OpenPoAssumptionLine itself.
const STATUS_CYCLE: OpenPoStatus[] = ["In Transit", "Open", "Partially Delivered"];

const DEFAULT_ROWS_PER_PAGE = 10;

// Line dates are stored/edited as "dd-mm-yyyy"; daysPastDue expects ISO.
function ddMmYyyyToIso(date: string): string {
  const [d, m, y] = date.split("-");
  return d && m && y ? `${y}-${m}-${d}` : date;
}

function weekOfMonth(dateDdMmYyyy: string): number | null {
  const m = dateDdMmYyyy.match(/^(\d{2})-\d{2}-\d{4}$/);
  return m ? Math.min(5, Math.ceil(parseInt(m[1], 10) / 7)) : null;
}

// Only rendered when the New CBU has open PO lines (RMPM status "po_available") —
// the no-PO-date cases are handled inline on the tile itself instead of this modal.
export function RmpmConnectivityContent({ lines }: { lines: OpenPoAssumptionLine[] }) {
  const lineKey = useMemo(() => lines.map((l) => l.id).join("|"), [lines]);
  const [etaDates, setEtaDates] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  useEffect(() => {
    setEtaDates(Object.fromEntries(lines.map((l) => [l.id, l.eta])));
    setPage(1);
  }, [lineKey, lines]);

  const totalRows = lines.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedLines = lines.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="px-6 py-5">
      <p className="text-xs mb-3" style={{ color: C.muted }}>
        Delivery date · week is as per PO (SAP) and read-only. ETA reflects the latest status and can be edited.
      </p>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {[
                "SITE CODE",
                "SITE CLUSTER",
                "MATERIAL",
                "VENDOR",
                "PO NUMBER",
                "OPEN PO QTY",
                "UOM",
                "DELIVERY DATE · WEEK",
                "ETA",
                "AVG LT (DAYS)",
                "PO AGEING",
                "STATUS",
              ].map((h, i, arr) => (
                <th
                  key={h}
                  className={`py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap ${
                    i === 0 ? "pl-4 pr-3" : i === arr.length - 1 ? "pl-3 pr-4" : "px-3"
                  }`}
                  style={{ color: C.white, fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedLines.map((line, i) => {
              const eta = etaDates[line.id] ?? line.eta;
              const poStatus = STATUS_CYCLE[i % STATUS_CYCLE.length];
              const statusStyle = OPEN_PO_STATUS_STYLE[poStatus];
              const ageing = daysPastDue(ddMmYyyyToIso(eta));
              const week = weekOfMonth(line.date);
              return (
                <tr key={line.id} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="pl-4 pr-3 py-2.5 font-semibold whitespace-nowrap" style={{ color: C.blue }}>
                    {line.plantCode}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.siteCluster}
                  </td>
                  <td className="px-3 py-2.5">
                    <ComponentCodeWithDesc code={line.componentCode} description={line.description} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium" style={{ color: C.navy }}>
                    {line.vendorName}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.poNumber}
                  </td>
                  <td className="px-3 py-2.5 font-bold tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                    {line.qty.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{line.uom}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.muted }}>
                    {line.date}
                    {week !== null && (
                      <span
                        className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                        style={{ backgroundColor: C.bgBlue, color: C.blue }}
                      >
                        Week {week}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <DateWeekEditor
                      date={eta}
                      onChange={(d) => setEtaDates((prev) => ({ ...prev, [line.id]: d }))}
                    />
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{line.averageLeadTimeDays}</td>
                  <td
                    className="px-3 py-2.5 font-semibold tabular-nums"
                    style={{ color: ageing ? C.dangerDark : C.borderLight }}
                  >
                    {ageing ?? "—"}
                  </td>
                  <td className="pl-3 pr-4 py-2.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                    >
                      {poStatus}
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
