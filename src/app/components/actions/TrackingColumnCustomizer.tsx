import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff, RotateCcw, Settings2 } from "lucide-react";
import { REQUIRED_TRACKING_COLUMNS } from "./ActionsTable";

export const TRACKING_COLUMN_OPTIONS = [
  ["networkId", "Network ID"],
  ["scenario", "Scenario Type"],
  ["actionId", "Action ID"],
  ["description", "Description"],
  ["owner", "Owner"],
  ["sla", "SLA"],
  ["ageing", "Ageing"],
  ["status", "Status"],
  ["action", "Action"],
] as const;

export function TrackingColumnCustomizer({
  hiddenColumns,
  onChange,
}: {
  hiddenColumns: Set<string>;
  onChange: (column: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function resetColumns() {
    onChange("__reset__");
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} title="Customise table columns" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer" style={{ color: "#374151", border: "1px solid #1565C0", backgroundColor: open ? "rgba(21,101,192,0.14)" : "rgba(21,101,192,0.08)" }}>
        <Settings2 size={12} />
        Customise
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl shadow-xl" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(21,101,192,0.2)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#003087" }}>
              <Settings2 size={13} style={{ color: "#1565C0" }} />
              Customise Columns
            </div>
            <button type="button" onClick={resetColumns} className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: "#1565C0" }}>
              <RotateCcw size={10} /> Reset
            </button>
          </div>
          <div className="px-4 py-2 text-[9px] uppercase tracking-wide" style={{ color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>Toggle to show/hide columns</div>
          <div className="max-h-80 overflow-y-auto py-2">
            {TRACKING_COLUMN_OPTIONS.map(([id, label]) => {
            const required = REQUIRED_TRACKING_COLUMNS.has(id);
            const visible = required || !hiddenColumns.has(id);
            return (
              <div key={id} className="flex items-center gap-2 px-4 py-2 cursor-pointer" style={{ color: visible ? "#111827" : "#9ca3af", textDecoration: visible ? "none" : "line-through" }}>
                <span className="flex-1 text-xs">{label}</span>
                    <button type="button" onClick={() => { if (!required) onChange(id); }} disabled={required} className={required ? "cursor-not-allowed disabled:grayscale-25" : "cursor-pointer"} title={required ? "Default column" : visible ? "Hide column" : "Show column"} aria-label={required ? `${label} is a default column` : visible ? `Hide ${label}` : `Show ${label}`} style={{ color: "#1565C0" }}>
                  {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            );
          })}
          </div>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: "1px solid #e5e7eb" }}>
            <span className="text-[9px]" style={{ color: "#6b7280" }}>{TRACKING_COLUMN_OPTIONS.length - hiddenColumns.size} visible · {hiddenColumns.size} hidden</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-xs cursor-pointer" style={{ backgroundColor: "#EDF5FA", color: "#374151", border: "1px solid rgba(21,101,192,0.2)" }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}