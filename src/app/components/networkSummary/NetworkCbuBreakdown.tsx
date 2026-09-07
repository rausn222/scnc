import { STICKY_COL_WIDTH, type NetworkCbuMapping } from "./networkData";

const CBU_GRID_COLS = `${STICKY_COL_WIDTH}px 220px`;
const NAVY = "#003087";
const GREEN = "#15803d";
const RED = "#b91c1c";

export function NetworkCbuBreakdown({ cbus }: Readonly<{ cbus: NetworkCbuMapping[] }>) {
  if (cbus.length === 0) {
    return (
      <div className="px-4 py-4 text-center text-xs" style={{ color: "#94a3b8" }}>
        No CBU-level data available for this network.
      </div>
    );
  }

  return (
    <div style={{ position: "sticky", left: 0, width: "fit-content", backgroundColor: "#ffffff" }}>
      <div
        className="grid items-center py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: CBU_GRID_COLS, color: NAVY, borderTop: "1px solid #dbe6f6", borderBottom: "1px solid #dbe6f6" }}
      >
        <span className="px-4">Old CBU</span>
        <span className="px-3">→ New CBU</span>
      </div>

      {cbus.map((c) => {
        return (
          <div
            key={c.id}
            className="grid items-center py-3"
            style={{ gridTemplateColumns: CBU_GRID_COLS, borderBottom: "1px solid #dbe6f6" }}
          >
            <div className="min-w-0 px-4">
              <p className="text-xs font-bold truncate" style={{ color: NAVY }}>
                {c.oldCode}
              </p>
              <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
                {c.oldDescription}
              </p>
            </div>

            <div className="min-w-0 px-3">
              {c.newCode ? (
                <>
                  <p className="text-xs font-bold truncate" style={{ color: GREEN }}>
                    {c.newCode}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
                    {c.newDescription}
                  </p>
                </>
              ) : (
                <p className="text-xs font-bold italic" style={{ color: RED }}>
                  Discontinued
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
