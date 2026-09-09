import type React from "react";
import { Clock } from "lucide-react";
import { C } from "../../sciDetails/constants";
import { AssumptionDateInput } from "../../sciDetails/AssumptionDateInput";

/**
 * Standalone tile for a Step 2 date assumption — unlike the other Step 2
 * tiles, the date picker is simple enough to stay inline instead of behind
 * a modal.
 */
export function DateAssumptionTile({
  icon = <Clock size={16} style={{ color: C.blue }} />,
  title = "Network transition pre-defined date",
  subtitle = "Transition date (today onwards)",
  badge,
  value,
  onChange,
  min,
}: {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Optional status pill shown between the subtitle and the date input — e.g. why no PO-derived date is available yet. */
  badge?: React.ReactNode;
  value: string;
  onChange: (next: string) => void;
  min?: string;
}) {
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 h-full"
      style={{ border: `1px solid ${C.border}`, backgroundColor: C.white }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: C.bgBlue }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: C.navy }} title={title}>
          {title}
        </p>
        <p className="text-[11px] truncate" style={{ color: C.muted }}>
          {subtitle}
        </p>
      </div>
      {badge ? (
        <div className="flex flex-col items-end gap-1 shrink-0">
          {badge}
          <AssumptionDateInput value={value} onChange={onChange} min={min} />
        </div>
      ) : (
        <AssumptionDateInput value={value} onChange={onChange} min={min} />
      )}
    </div>
  );
}
