import { ChevronDown, ChevronRight } from "lucide-react";
import { PlantRouteLabel } from "../PlantRouteLabel";
import { ComponentCodeWithDesc } from "../ComponentCodeWithDesc";
import { C, IUT_TRANSFER_LANES, IUT_LANE_REQUIREMENTS, RM_BADGE, PM_BADGE } from "../constants";

export function IutLaneRow({
  lane,
  possible,
  expanded,
  onToggleExpand,
  onTogglePossible,
}: {
  lane: (typeof IUT_TRANSFER_LANES)[number];
  possible: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onTogglePossible: () => void;
}) {
  const laneKey = `${lane.from}→${lane.to}`;
  const materials = (IUT_LANE_REQUIREMENTS[laneKey] ?? []).filter(
    (m) => m.type === lane.keepType,
  );

  return (
    <div style={{ borderTop: "1px solid #f8fafc" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        title={`${expanded ? "Collapse" : "Expand"} ${lane.from} → ${lane.to} lane details`}
        className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer"
        style={{
          backgroundColor: expanded ? "#EDF5F4" : undefined,
          outline: expanded ? "2px solid #1565C0" : undefined,
          outlineOffset: expanded ? -1 : undefined,
        }}
      >
        <span className="flex items-center gap-1.5 text-left min-w-0">
          {expanded ? (
            <ChevronDown size={13} style={{ color: C.blue, flexShrink: 0 }} />
          ) : (
            <ChevronRight size={13} style={{ color: C.blue, flexShrink: 0 }} />
          )}
          <PlantRouteLabel from={lane.from} to={lane.to} />
        </span>
        <label
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: possible ? C.green : "#94a3b8" }}
          >
            {possible ? "Possible" : "Not possible"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={possible}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePossible();
            }}
            title={`Mark ${lane.from} → ${lane.to} as ${possible ? "not possible" : "possible"}`}
            className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
            style={{ backgroundColor: possible ? C.green : "#cbd5e1" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ left: possible ? 22 : 2 }}
            />
          </button>
        </label>
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
              RM/PM required for transfer
            </span>
          </div>
          {materials.length === 0 ? (
            <p
              className="px-4 pb-3 text-xs italic"
              style={{ color: "#64748b" }}
            >
              No RM/PM requirements for this lane
            </p>
          ) : (
            materials.map((mat, idx) => {
              const badge = mat.type === "RM" ? RM_BADGE : PM_BADGE;
              return (
                <div
                  key={mat.code}
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
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {mat.type}
                    </span>
                    <ComponentCodeWithDesc
                      code={mat.code}
                      description={mat.description}
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px]" style={{ color: "#64748b" }}>
                      Required qty
                    </p>
                    <p
                      className="text-xs font-bold tabular-nums"
                      style={{ color: C.navy }}
                    >
                      {mat.requiredQty.toLocaleString("en-IN")} {mat.uom}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
