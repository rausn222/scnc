import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ROWS_PER_PAGE_OPTIONS,
  ROWS_PER_PAGE_LABEL,
  PREV_PAGE_ARIA_LABEL,
  NEXT_PAGE_ARIA_LABEL,
} from "../../constants/nationalDashboard";
import { getVisiblePages } from "./utils";

export function TablePagination({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalRows === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = Math.min(safePage * rowsPerPage, totalRows);
  const pages = getVisiblePages(safePage, totalPages);

  return (
    <div
      className="shrink-0 px-4 py-2.5 flex items-center justify-between border-t text-xs"
      style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span style={{ color: "#374151" }}>{ROWS_PER_PAGE_LABEL}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-xs cursor-pointer bg-white"
            style={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <span style={{ color: "#6b7280" }}>
          {start}-{end} of {totalRows}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="p-1 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label={PREV_PAGE_ARIA_LABEL}
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 select-none"
              style={{ color: "#6b7280" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="min-w-[28px] h-7 px-1.5 rounded text-xs font-medium cursor-pointer transition-colors"
              style={
                p === safePage
                  ? { backgroundColor: "#1565C0", color: "#ffffff" }
                  : { color: "#374151" }
              }
              onMouseEnter={(e) => {
                if (p !== safePage) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#f3f4f6";
                }
              }}
              onMouseLeave={(e) => {
                if (p !== safePage) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="p-1 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          style={{ color: "#374151" }}
          aria-label={NEXT_PAGE_ARIA_LABEL}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
