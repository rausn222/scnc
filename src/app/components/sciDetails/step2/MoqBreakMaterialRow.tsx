import { ChevronDown, ChevronRight } from "lucide-react";
import { ComponentCodeWithDesc } from "../ComponentCodeWithDesc";
import { ToggleSwitch } from "../ToggleSwitch";
import { ConfidenceScoreBar } from "../ConfidenceScoreBar";
import { C, MOQ_BREAK_MATERIALS, MOQ_BREAK_SUPPLIERS } from "../constants";

export function MoqBreakMaterialRow({
  mat,
  canBreak,
  expanded,
  onToggleExpand,
  onToggleBreak,
}: {
  mat: (typeof MOQ_BREAK_MATERIALS)[number];
  canBreak: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleBreak: (next: boolean) => void;
}) {
  const suppliers = MOQ_BREAK_SUPPLIERS[mat.code] ?? [];

  return (
    <div style={{ borderTop: "1px solid #f8fafc" }}>
      <div
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors"
        style={{
          backgroundColor: expanded ? "#EDF5F4" : undefined,
          outline: expanded ? "2px solid #1565C0" : undefined,
          outlineOffset: expanded ? -1 : undefined,
        }}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          title={`${expanded ? "Collapse" : "Expand"} supplier & MOQ break details for ${mat.code}`}
          className="flex items-center cursor-pointer gap-2 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown size={13} style={{ color: C.blue, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: C.blue, flexShrink: 0 }} />
          )}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
            style={{ backgroundColor: mat.badgeBg, color: mat.badgeColor }}
          >
            {mat.type}
          </span>
          <ComponentCodeWithDesc code={mat.code} description={mat.description} />
        </button>
        <ToggleSwitch
          checked={canBreak}
          onChange={onToggleBreak}
          label={canBreak ? "Can break" : "Cannot break"}
        />
      </div>

      {expanded && (
        <div
          style={{
            backgroundColor: "#EDF5F4",
            borderTop: "1px solid rgba(21,101,192,0.12)",
          }}
        >
          <div className="px-4 py-2">
            <span
              className="flex items-center gap-2 text-xs font-semibold"
              style={{ color: C.blue }}
            >
              <span style={{ color: "rgba(21,101,192,0.6)" }}>└</span>
              Suppliers &amp; MOQ break confidence
            </span>
          </div>
          {suppliers.length === 0 ? (
            <p
              className="px-4 pb-3 text-xs italic"
              style={{ color: "#64748b" }}
            >
              No supplier data for this material
            </p>
          ) : (
            suppliers.map((supplier) => (
              <div
                key={supplier.name}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
                style={{
                  borderTop: "1px solid rgba(21,101,192,0.08)",
                  backgroundColor: "#ffffff",
                }}
              >
                <div className="flex items-center gap-2 min-w-0 pl-3">
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "rgba(21,101,192,0.6)" }}
                  >
                    ⌞
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>
                    {supplier.name}
                  </span>
                </div>
                <ConfidenceScoreBar score={supplier.confidenceScore} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
