import { useState } from "react";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, RM_BADGE, PM_BADGE, SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS } from "../../sciDetails/constants";
import { TablePagination } from "../../nationalDashboard/TablePagination";

const DEFAULT_ROWS_PER_PAGE = 10;

/**
 * "Supplier inventory & feedstock" assumption — Supplier inventory pre-fills from
 * matching OPEN_PO_LINES data where available (see SimulationAssumptionsStep's
 * initialSupplierInventory), Feedstock has no existing data source so it seeds from
 * mock values instead. Both stay freely editable per material.
 */
export function SupplierInventoryFeedstockContent({
  supplierInventory,
  onSupplierInventoryChange,
  feedstock,
  onFeedstockChange,
}: {
  supplierInventory: Record<string, string>;
  onSupplierInventoryChange: (materialCode: string, value: string) => void;
  feedstock: Record<string, string>;
  onFeedstockChange: (materialCode: string, value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const totalRows = SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedMaterials = SUPPLIER_INVENTORY_FEEDSTOCK_MATERIALS.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  return (
    <div className="px-6 py-5">
      <p className="text-xs mb-3" style={{ color: C.muted }}>
        Supplier inventory pre-fills from open PO data where available — edit either column as needed.
      </p>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: C.navy }}>
                {["MATERIAL", "BASE UOM", "SUPPLIER", "SUPPLIER INVENTORY", "FEEDSTOCK"].map((h) => (
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
              {pagedMaterials.map((material) => {
                const badge = material.materialType === "RM" ? RM_BADGE : PM_BADGE;
                return (
                  <tr key={material.materialCode} style={{ borderTop: `1px solid ${C.bgSlate}` }}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-start gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {material.materialType}
                        </span>
                        <ComponentCodeWithDesc code={material.materialCode} description={material.description} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{material.baseUom}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium" style={{ color: C.navy }}>{material.supplierName}</div>
                      <div className="text-[10px]" style={{ color: C.borderMuted }}>{material.supplierCode}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={supplierInventory[material.materialCode] ?? ""}
                        onChange={(e) => onSupplierInventoryChange(material.materialCode, e.target.value)}
                        placeholder="—"
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={feedstock[material.materialCode] ?? ""}
                        onChange={(e) => onFeedstockChange(material.materialCode, e.target.value)}
                        placeholder="—"
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
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
