import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search, X, AlertTriangle } from "lucide-react";
import { type CBURow } from "./data";
import { Loader } from "./Loader";
import { useStockBreakdownQuery } from "../queries/cbuQueries";
import {
  STOCK_BREAKDOWN_LOADING_TEXT,
  STOCK_BREAKDOWN_ERROR_TEXT,
} from "../constants/nationalDashboard";

interface Props {
  kind: "dc" | "factory" | "transit";
  row: CBURow;
  onClose: () => void;
}

const KIND_META = {
  dc: {
    heading: "DC STOCK BREAKDOWN",
    totalLabel: "TOTAL DC STOCK",
    codeLabel: "DC Code",
    filterPlaceholder: "Filter DC code",
    emptyText: "No detailed DC-level breakdown is available for this CBU yet.",
    showSubStatus: true,
    totalColLabel: "Total (Excl. In-Transit)",
  },
  factory: {
    heading: "FACTORY STOCK BREAKDOWN",
    totalLabel: "TOTAL FACTORY STOCK",
    codeLabel: "Plant Code",
    filterPlaceholder: "Filter plant code…",
    emptyText: "No detailed factory-level breakdown is available for this CBU yet.",
    showSubStatus: true,
    totalColLabel: "Total (Excl. In-Transit)",
  },
  transit: {
    heading: "IN-TRANSIT STOCK BREAKDOWN",
    totalLabel: "TOTAL IN-TRANSIT STOCK",
    codeLabel: "Route",
    codeSubtext: "Source → Destination",
    filterPlaceholder: "Filter route",
    emptyText: "No detailed in-transit breakdown is available for this CBU yet.",
    showSubStatus: false,
    totalColLabel: "Total In-Transit",
  },
} as const;

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

// Route values look like "U635 → PATH" — split for a tooltip that
// spells out source/destination instead of relying on the arrow glyph alone.
function routeTooltip(route: string): string {
  const [source, destination] = route.split(" → ");
  return destination
    ? `Source: ${source}  ·  Destination: ${destination}`
    : route;
}

export function StockLocationBreakdownModal({ kind, row, onClose }: Props) {
  const [filter, setFilter] = useState("");
  const meta = KIND_META[kind];
  const columnCount = meta.showSubStatus ? 6 : 3;

  const { data: stockRows, isLoading, isError } = useStockBreakdownQuery(kind, row);

  const allRows = useMemo(() => {
    // Show only rows with a non-zero total.
    return (stockRows ?? []).filter((r) => r.totalStockExclInTransit > 0);
  }, [stockRows]);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allRows;

    return allRows.filter((r) =>
      r.plantCode.toLowerCase().includes(q),
    );
  }, [allRows, filter]);

  const activeCount = allRows.length;

  const totalStock = filteredRows.reduce(
    (s, r) => s + r.totalStockExclInTransit,
    0,
  );

  const overallTotalStock = allRows.reduce(
    (s, r) => s + r.totalStockExclInTransit,
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,48,135,0.18)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col overflow-hidden"
        style={{
          width: "min(92vw, 820px)",
          maxHeight: "88vh",
          backgroundColor: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 20px 60px rgba(0,48,135,0.18), 0 4px 16px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 pt-5 pb-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)",
          }}
        >
          <p
            className="text-xs font-bold tracking-widest mb-2"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
            }}
          >
            {meta.heading}
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-white" style={{ fontSize: 22 }}>
                {row.cbuCode}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                {row.cbuDescription}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer transition-colors shrink-0 mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div
          className="grid shrink-0"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            backgroundColor: "#EFF4FB",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          {[
            {
              label: meta.totalLabel,
              value: fmt(filter ? totalStock : overallTotalStock),
              sub: filter ? "matching filter" : "non-zero locations",
            },
            {
              label: "ACTIVE LOCATIONS",
              value: String(activeCount),
              sub: "non-zero stock only",
            },
          ].map((k, i) => (
            <div
              key={k.label}
              className="px-5 py-4"
              style={{
                borderLeft: i > 0 ? "1px solid #e2e8f0" : undefined,
              }}
            >
              <p
                className="uppercase mb-1"
                style={{
                  color: "#1565C0",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                }}
              >
                {k.label}
              </p>

              <p
                style={{
                  fontSize: 20,
                  color: "#003087",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {k.value}
              </p>

              <p className="mt-1" style={{ color: "#94a3b8", fontSize: 11 }}>
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {allRows.length > 0 && (
          <div
            className="px-6 py-3 shrink-0"
            style={{ borderBottom: "1px solid #e2e8f0" }}
          >
            <div className="relative" style={{ maxWidth: 260 }}>
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9ca3af" }}
              />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={meta.filterPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs focus:outline-none"
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <AlertTriangle size={20} style={{ color: "#dc2626" }} />
              <p
                className="text-sm italic text-center"
                style={{ color: "#94a3b8" }}
              >
                {STOCK_BREAKDOWN_ERROR_TEXT}
              </p>
            </div>
          ) : isLoading ? (
            <div className="h-40">
              <Loader label={STOCK_BREAKDOWN_LOADING_TEXT} />
            </div>
          ) : allRows.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p
                className="text-sm italic text-center"
                style={{ color: "#94a3b8" }}
              >
                {meta.emptyText}
              </p>
            </div>
          ) : (
            <div
              className="overflow-auto rounded-lg"
              style={{ maxHeight: 420, border: "1px solid #e2e8f0" }}
            >
              <table
                className="w-full text-xs"
                style={{ borderCollapse: "collapse" }}
              >
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: "#003087" }}>
                    {[
                      meta.codeLabel,
                      "UOM",
                      ...(meta.showSubStatus
                        ? ["Unrestricted", "Quality", "Blocked"]
                        : []),
                      meta.totalColLabel,
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 font-bold uppercase tracking-wide whitespace-nowrap ${i === 0 ? "text-left" : "text-right"
                          }`}
                        style={{ color: "#ffffff", fontSize: 9 }}
                      >
                        {h}
                        {i === 0 && "codeSubtext" in meta && meta.codeSubtext && (
                          <span
                            className="block font-normal normal-case"
                            style={{ fontSize: 9, color: "#bfdbfe" }}
                          >
                            {meta.codeSubtext}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columnCount}
                        className="px-4 py-8 text-center italic"
                        style={{ color: "#94a3b8" }}
                      >
                        No codes match your filter
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, i) => (
                      <tr
                        key={r.plantCode}
                        style={{
                          backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td
                          title={kind === "transit" ? routeTooltip(r.plantCode) : undefined}
                          className="px-3 py-1.5 font-semibold"
                          style={{
                            color: "#003087",
                            borderRight: "1px solid #e2e8f0",
                          }}
                        >
                          {r.plantCode}
                        </td>

                        <td
                          className="px-3 py-1.5 text-right"
                          style={{ color: "#64748b" }}
                        >
                          {r.baseUom}
                        </td>

                        {meta.showSubStatus && (
                          <>
                            <td
                              className="px-3 py-1.5 text-right tabular-nums"
                              style={{
                                color:
                                  r.unrestrictedStock > 0 ? "#111827" : "#cbd5e1",
                              }}
                            >
                              {fmt(r.unrestrictedStock)}
                            </td>

                            <td
                              className="px-3 py-1.5 text-right tabular-nums"
                              style={{
                                color: r.qualityStock > 0 ? "#111827" : "#cbd5e1",
                              }}
                            >
                              {fmt(r.qualityStock)}
                            </td>

                            <td
                              className="px-3 py-1.5 text-right tabular-nums"
                              style={{
                                color: r.blockedStock > 0 ? "#dc2626" : "#cbd5e1",
                              }}
                            >
                              {fmt(r.blockedStock)}
                            </td>
                          </>
                        )}

                        <td
                          className="px-3 py-1.5 text-right font-bold tabular-nums"
                          style={{ color: "#003087" }}
                        >
                          {fmt(r.totalStockExclInTransit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: "#EFF4FB" }}>
                      <td
                        colSpan={columnCount - 1}
                        className="px-3 py-2 text-right font-bold uppercase tracking-wide"
                        style={{
                          color: "#003087",
                          fontSize: 10,
                        }}
                      >
                        Total
                      </td>
                      <td
                        className="px-3 py-2 text-right font-bold tabular-nums"
                        style={{ color: "#003087" }}
                      >
                        {fmt(totalStock)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}