import { useState } from "react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, MOQ_BREAK_MATERIALS, MOQ_BREAK_SUPPLIERS, moqSupplierKey } from "../../sciDetails/constants";
import { confidenceMeta } from "../../sciDetails/utils";
import { TablePagination } from "../../nationalDashboard/TablePagination";

const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * Every material's supplier confidence/SOB data is shown up front — no
 * expand/collapse. Each supplier gets its own "Can break MOQ" switch, since
 * MOQ-break feasibility can differ supplier to supplier within a material.
 */
export function MoqBreakContent({
  moqBreak,
  onToggleBreak,
}: {
  /** Keyed by `moqSupplierKey(materialCode, supplierName)`. */
  moqBreak: Record<string, boolean>;
  onToggleBreak: (key: string, next: boolean) => void;
}) {
  const materialsWithSuppliers = MOQ_BREAK_MATERIALS.filter((mat) => (MOQ_BREAK_SUPPLIERS[mat.code] ?? []).length > 0);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = materialsWithSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedMaterials = materialsWithSuppliers.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="px-6 py-5">
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {["MATERIAL", "SUPPLIER", "CONFIDENCE", "SOB", "LEAD TIME (DAYS)", "CAN BREAK MOQ"].map((h, i, arr) => (
                <th
                  key={h}
                  className={`py-4 font-bold uppercase tracking-wide whitespace-nowrap ${
                    i === 0 ? "pl-6 pr-5" : i === arr.length - 1 ? "pl-5 pr-8" : "px-5"
                  } ${[2, 3, 4].includes(i) ? "text-center" : "text-left"}`}
                  style={{ color: C.white, fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedMaterials.map((mat) => {
              const suppliers = MOQ_BREAK_SUPPLIERS[mat.code] ?? [];

              return (
                <tr key={mat.code} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                  <td className="pl-6 pr-5 py-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: mat.badgeBg, color: mat.badgeColor }}
                      >
                        {mat.type}
                      </span>
                      <ComponentCodeWithDesc code={mat.code} description={mat.description} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <p key={supplier.name} className="font-semibold whitespace-nowrap" style={{ color: C.navy }}>
                          {supplier.name}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <p
                          key={supplier.name}
                          className="font-bold tabular-nums whitespace-nowrap"
                          style={{ color: confidenceMeta(supplier.confidenceScore).color }}
                        >
                          {supplier.confidenceScore}%
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <p key={supplier.name} className="font-bold tabular-nums whitespace-nowrap" style={{ color: C.navy }}>
                          {supplier.sob}%
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => (
                        <p key={supplier.name} className="tabular-nums whitespace-nowrap" style={{ color: C.muted }}>
                          {supplier.leadTimeDays}
                        </p>
                      ))}
                    </div>
                  </td>

                  <td className="pl-5 pr-8 py-4">
                    <div className="space-y-4">
                      {suppliers.map((supplier) => {
                        const key = moqSupplierKey(mat.code, supplier.name);
                        const canBreak = moqBreak[key];
                        return (
                          <label
                            key={supplier.name}
                            className="flex items-center gap-2 cursor-pointer"
                            style={{ width: 108 }}
                          >
                            <button
                              type="button"
                              role="switch"
                              aria-checked={canBreak}
                              onClick={() => onToggleBreak(key, !canBreak)}
                              title={`Mark MOQ break for ${mat.code} / ${supplier.name} as ${canBreak ? "not possible" : "possible"}`}
                              className="relative w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0"
                              style={{ backgroundColor: canBreak ? C.blue : C.borderLight }}
                            >
                              <span
                                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                                style={{ left: canBreak ? 17 : 2 }}
                              />
                            </button>
                            <span
                              className="text-xs font-semibold whitespace-nowrap"
                              style={{ color: canBreak ? C.blue : C.borderMuted }}
                            >
                              {canBreak ? "Can break" : "Cannot break"}
                            </span>
                          </label>
                        );
                      })}
                    </div>
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
