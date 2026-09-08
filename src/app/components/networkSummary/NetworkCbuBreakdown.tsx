import { STICKY_COL_WIDTH, type NetworkCbuMapping } from "./networkData";

const CBU_GRID_COLS = `${STICKY_COL_WIDTH}px 220px`;
const NAVY = "#003087";
const GREEN = "#15803d";
const RED = "#b91c1c";

type CbuEntry = { code: string; description: string | null };
type CbuGroup = { key: string; oldEntries: CbuEntry[]; newEntries: CbuEntry[] };

/** Groups flat old→new CBU pairs into display rows that cover every mapping shape:
 * one→one, many old CBUs consolidating into one new CBU, one old CBU splitting into
 * many new CBUs, and one old CBU with no replacement (discontinued). */
function groupCbuMappings(cbus: NetworkCbuMapping[]): CbuGroup[] {
  const byOldCode = new Map<string, NetworkCbuMapping[]>();
  for (const c of cbus) {
    const bucket = byOldCode.get(c.oldCode);
    if (bucket) bucket.push(c);
    else byOldCode.set(c.oldCode, [c]);
  }

  const groups: CbuGroup[] = [];
  const singles: NetworkCbuMapping[] = [];

  for (const [oldCode, rows] of byOldCode) {
    if (rows.length > 1) {
      // One old CBU → many new CBUs.
      groups.push({
        key: `one-to-many:${oldCode}`,
        oldEntries: [{ code: oldCode, description: rows[0].oldDescription }],
        newEntries: rows
          .filter((r) => r.newCode)
          .map((r) => ({ code: r.newCode!, description: r.newDescription })),
      });
    } else {
      singles.push(rows[0]);
    }
  }

  const byNewCode = new Map<string, NetworkCbuMapping[]>();
  const discontinued: NetworkCbuMapping[] = [];
  for (const c of singles) {
    if (!c.newCode) {
      discontinued.push(c);
      continue;
    }
    const bucket = byNewCode.get(c.newCode);
    if (bucket) bucket.push(c);
    else byNewCode.set(c.newCode, [c]);
  }

  for (const [newCode, rows] of byNewCode) {
    if (rows.length > 1) {
      // Many old CBUs → one new CBU.
      groups.push({
        key: `many-to-one:${newCode}`,
        oldEntries: rows.map((r) => ({ code: r.oldCode, description: r.oldDescription })),
        newEntries: [{ code: newCode, description: rows[0].newDescription }],
      });
    } else {
      // One old CBU → one new CBU.
      groups.push({
        key: `one-to-one:${rows[0].id}`,
        oldEntries: [{ code: rows[0].oldCode, description: rows[0].oldDescription }],
        newEntries: [{ code: newCode, description: rows[0].newDescription }],
      });
    }
  }

  for (const c of discontinued) {
    // One old CBU → none.
    groups.push({
      key: `discontinued:${c.id}`,
      oldEntries: [{ code: c.oldCode, description: c.oldDescription }],
      newEntries: [],
    });
  }

  return groups;
}

function CbuEntryList({ entries, color }: { entries: CbuEntry[]; color: string }) {
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div key={`${entry.code}-${i}`}>
          <p className="text-xs font-bold truncate" style={{ color }}>
            {entry.code}
          </p>
          {entry.description && (
            <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
              {entry.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function NetworkCbuBreakdown({ cbus }: Readonly<{ cbus: NetworkCbuMapping[] }>) {
  if (cbus.length === 0) {
    return (
      <div className="px-4 py-4 text-center text-xs" style={{ color: "#94a3b8" }}>
        No CBU-level data available for this network.
      </div>
    );
  }

  const groups = groupCbuMappings(cbus);

  return (
    <div style={{ position: "sticky", left: 0, width: "fit-content", backgroundColor: "#ffffff" }}>
      <div
        className="grid items-center py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: CBU_GRID_COLS, color: NAVY, borderTop: "1px solid #dbe6f6", borderBottom: "1px solid #dbe6f6" }}
      >
        <span className="px-4">Old CBU</span>
        <span className="px-3">→ New CBU</span>
      </div>

      {groups.map((group) => {
        return (
          <div
            key={group.key}
            className="grid items-center py-3"
            style={{ gridTemplateColumns: CBU_GRID_COLS, borderBottom: "1px solid #dbe6f6" }}
          >
            <div className="min-w-0 px-4">
              <CbuEntryList entries={group.oldEntries} color={NAVY} />
            </div>

            <div className="min-w-0 px-3">
              {group.newEntries.length > 0 ? (
                <CbuEntryList entries={group.newEntries} color={GREEN} />
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
