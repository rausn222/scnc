import { fmtMoney, statusColor, type NetworkCbuMapping } from "./networkData";

const CBU_GRID_COLS = "minmax(160px,1.3fr) minmax(160px,1.3fr) 110px minmax(120px,1fr)";
const NAVY = "#003087";
const GREEN = "#15803d";
const RED = "#b91c1c";

export function NetworkCbuBreakdown({ cbus }: Readonly<{ cbus: NetworkCbuMapping[] }>) {
  if (cbus.length === 0) {
    return (
      <div className="px-4 py-4 text-center text-xs" style={{ backgroundColor: "#fafbfe", color: "#94a3b8" }}>
        No CBU-level data available for this network.
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fafbfe" }}>
      <div
        className="grid items-center px-4 py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: CBU_GRID_COLS, color: NAVY, borderTop: "1px solid #dbe6f6", borderBottom: "1px solid #dbe6f6" }}
      >
        <span>Old CBU</span>
        <span>→ New CBU</span>
        <span>Status</span>
        <span className="text-right">Value at Risk</span>
      </div>

      {cbus.map((c) => {
        const sc = statusColor(c.status);
        return (
          <div
            key={c.id}
            className="grid items-center px-4 py-3"
            style={{ gridTemplateColumns: CBU_GRID_COLS, borderBottom: "1px solid #dbe6f6" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: NAVY }}>
                {c.oldCode}
              </p>
              <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
                {c.oldDescription}
              </p>
            </div>

            <div className="min-w-0">
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

            <div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{ backgroundColor: sc.bg, color: sc.text }}
              >
                {c.status}
              </span>
            </div>

            <span className="text-xs font-bold text-right" style={{ color: c.status === "At Risk" ? RED : NAVY }}>
              {fmtMoney(c.valueAtRisk)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
