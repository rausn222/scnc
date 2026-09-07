import type { UomFilter } from "./types";

export function fmtNWithTheme(
  n: number,
  wt: number,
  uom: UomFilter,
  textColor: string,
): React.ReactNode {
  if (n === 0) return <span style={{ color: "#d1d5db" }}>—</span>;
  if (uom === "MT") {
    const t = (n * wt) / 1000;
    return (
      <span style={{ color: textColor }}>
        {t < 1 ? t.toFixed(3) : t.toFixed(2)}
      </span>
    );
  }
  return <span style={{ color: textColor }}>{n.toLocaleString()}</span>;
}

export function fmtDaysThemed(
  d: number | null,
  textColor: string,
): React.ReactNode {
  if (d === null) return <span style={{ color: "#d1d5db" }}>—</span>;
  return <span style={{ color: textColor, fontWeight: 700 }}>{d}d</span>;
}

export function fmtDateThemed(
  s: string,
  textColor: string,
): React.ReactNode {
  if (!s || s === "N/A")
    return (
      <span style={{ color: "#d1d5db", fontStyle: "italic", fontSize: 11 }}>
        N/A
      </span>
    );
  return <span style={{ color: textColor }}>{s}</span>;
}
