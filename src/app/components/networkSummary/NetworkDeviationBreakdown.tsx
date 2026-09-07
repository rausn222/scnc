import { deviationStatusColor, type NetworkRow } from "./networkData";

const BORDER = "#e2e8f0";

export function NetworkDeviationBreakdown({ row }: Readonly<{ row: NetworkRow }>) {
  const actionItems = row.deviationDetails ?? [];

  if (actionItems.length === 0) {
    return (
      <div className="px-4 py-4 text-center text-xs" style={{ color: "#94a3b8" }}>
        No deviation details available for this network.
      </div>
    );
  }

  return (
    <div style={{ position: "sticky", left: 0, width: "fit-content", backgroundColor: "#ffffff" }}>
      <table className="text-xs border-collapse" style={{ minWidth: 520 }}>
        <thead>
          <tr style={{ borderTop: "1px solid #dbe6f6", borderBottom: "1px solid #dbe6f6" }}>
            <th
              className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "#94a3b8" }}
            >
              Action Item
            </th>
            <th
              className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
              style={{ color: "#94a3b8" }}
            >
              Owner
            </th>
            <th
              className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
              style={{ color: "#94a3b8" }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {actionItems.map((item, i) => {
            const sc = deviationStatusColor(item.status);
            return (
              <tr key={item.actionId} style={{ borderTop: i > 0 ? `1px solid ${BORDER}` : undefined }}>
                <td className="px-4 py-2.5" style={{ color: "#111827" }}>
                  {item.description}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "#374151" }}>
                  {item.owner}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: sc.bg, color: sc.text }}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
