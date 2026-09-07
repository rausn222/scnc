import { ChevronDown, ChevronUp } from "lucide-react";
import type { SortDir } from "./types";

export function SortIndicator({
  colId,
  sortCol,
  sortDir,
  light = false,
}: {
  colId: string;
  sortCol: string | null;
  sortDir: SortDir;
  light?: boolean;
}) {
  const active = sortCol === colId;
  const color = light ? "rgba(255,255,255,0.9)" : undefined;
  if (!active) {
    return (
      <span
        className="inline-flex flex-col leading-none"
        style={{ opacity: light ? 0.5 : 0.35, color }}
      >
        <ChevronUp size={9} style={{ marginBottom: -3 }} />
        <ChevronDown size={9} />
      </span>
    );
  }
  return sortDir === "asc" ? (
    <ChevronUp size={12} style={{ color }} />
  ) : (
    <ChevronDown size={12} style={{ color }} />
  );
}
