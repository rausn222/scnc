import { TODAY } from "../data";
import type { UomFilter } from "./types";

export const fmt = (n: number) => (n === 0 ? "—" : n.toLocaleString("en-IN"));

export function fmtFg(
  fgUnits: number,
  uom: UomFilter,
  weightKg: number,
  bold = false,
  light = false,
): React.ReactNode {
  if (fgUnits === 0)
    return (
      <span style={{ color: light ? "rgba(255,255,255,0.35)" : "#cbd5e1" }}>
        —
      </span>
    );
  const style: React.CSSProperties = {
    color: light ? "#ffffff" : bold ? "#003087" : "#0f172a",
    fontWeight: bold || light ? 600 : 400,
  };
  if (uom === "MT") {
    const t = (fgUnits * weightKg) / 1000;
    return <span style={style}>{t < 1 ? t.toFixed(3) : t.toFixed(2)}</span>;
  }
  return <span style={style}>{fgUnits.toLocaleString("en-IN")}</span>;
}

export function calcCoverDate(stockQty: number, demandQty: number): string {
  if (stockQty <= 0 || demandQty <= 0) return "N/A";
  const days = Math.round(stockQty / (demandQty / 365));
  const dt = new Date(TODAY.getTime() + days * 86_400_000);
  return `${String(dt.getDate()).padStart(2, "0")}-${String(
    dt.getMonth() + 1,
  ).padStart(2, "0")}-${dt.getFullYear()}`;
}

export function fmtCoverDate(
  dateStr: string,
  bold = false,
  light = false,
): React.ReactNode {
  if (dateStr === "N/A")
    return (
      <span
        style={{
          color: light ? "rgba(255,255,255,0.35)" : "#cbd5e1",
          fontStyle: "italic",
        }}
      >
        N/A
      </span>
    );
  const style: React.CSSProperties = {
    color: light ? "#ffffff" : bold ? "#003087" : "#0f172a",
    fontWeight: bold || light ? 600 : 400,
  };
  return <span style={style}>{dateStr}</span>;
}
