interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/** Shimmering placeholder shaped like a data table, shown while its rows are still loading. */
export function TableSkeleton({
  rows = 8,
  columns = 6,
  showHeader = true,
}: Readonly<TableSkeletonProps>) {
  return (
    <div
      className="w-full overflow-hidden rounded-lg"
      style={{ border: "1px solid #e2e8f0" }}
    >
      <table className="w-full text-xs border-collapse">
        {showHeader && (
          <thead>
            <tr style={{ backgroundColor: "#003087" }}>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-3 py-2.5">
                  <div
                    className="h-3 rounded animate-pulse"
                    style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ backgroundColor: r % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-3 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div
                    className="h-3 rounded animate-pulse"
                    style={{
                      backgroundColor: "#e2e8f0",
                      width: `${55 + ((r * columns + c) % 5) * 8}%`,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
