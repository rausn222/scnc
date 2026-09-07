import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { C, MOQ_BREAK_MATERIALS, MOQ_BREAK_SUPPLIERS, moqSupplierKey } from "../../sciDetails/constants";
import { confidenceMeta } from "../../sciDetails/utils";

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
  return (
    <div className="px-6 py-5">
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #e2e8f0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: C.navy }}>
              {["MATERIAL", "SUPPLIER", "CONFIDENCE", "SOB", "LEAD TIME (DAYS)", "CAN BREAK MOQ"].map((h, i, arr) => (
                <th
                  key={h}
                  className={`py-4 font-bold uppercase tracking-wide whitespace-nowrap ${
                    i === 0 ? "pl-6 pr-5" : i === arr.length - 1 ? "pl-5 pr-8" : "px-5"
                  } ${[2, 3, 4].includes(i) ? "text-center" : "text-left"}`}
                  style={{ color: "#ffffff", fontSize: 9 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOQ_BREAK_MATERIALS.filter((mat) => (MOQ_BREAK_SUPPLIERS[mat.code] ?? []).length > 0).map((mat) => {
              const suppliers = MOQ_BREAK_SUPPLIERS[mat.code] ?? [];

              return (
                <tr key={mat.code} style={{ borderTop: "1px solid #f1f5f9" }}>
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
                        <p key={supplier.name} className="tabular-nums whitespace-nowrap" style={{ color: "#64748b" }}>
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
                              style={{ backgroundColor: canBreak ? C.blue : "#cbd5e1" }}
                            >
                              <span
                                className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                                style={{ left: canBreak ? 17 : 2 }}
                              />
                            </button>
                            <span
                              className="text-xs font-semibold whitespace-nowrap"
                              style={{ color: canBreak ? C.blue : "#94a3b8" }}
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
    </div>
  );
}
