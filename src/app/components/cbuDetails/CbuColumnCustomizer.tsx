import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, RotateCcw, Settings2 } from "lucide-react";
import {
  STOCK_COLUMN_DEFS,
  STOCK_COL_GROUP_LABELS,
  DEFAULT_HIDDEN_STOCK_COLS,
  STOCK_COLUMN_CUSTOMIZER_LABELS,
  type StockColGroup,
} from "../../constants/cbuDetail";

const GROUPS: StockColGroup[] = ["metric", "extra"];

export function CbuColumnCustomizer({
  hiddenCols,
  onChange,
}: {
  hiddenCols: Set<string>;
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggleCol(id: string) {
    const next = new Set(hiddenCols);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(Array.from(next));
  }

  function resetCustomization() {
    onChange(DEFAULT_HIDDEN_STOCK_COLS);
  }

  const visibleCount = STOCK_COLUMN_DEFS.length - hiddenCols.size;

  return (
    <div className="relative flex flex-col gap-1" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium cursor-pointer transition-colors"
        style={{
          backgroundColor: open
            ? "rgba(0,200,240,0.18)"
            : "rgba(21,101,192,0.08)",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: open ? "#5a8fbf" : "#1565C0",
          color: "#374151",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <Settings2 size={12} />
        {STOCK_COLUMN_CUSTOMIZER_LABELS.toggleButton}
        <span
          className="px-1.5 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: "rgba(21,101,192,0.15)",
            color: "#1565C0",
            fontSize: 9,
          }}
        >
          {visibleCount}/{STOCK_COLUMN_DEFS.length}
        </span>
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full mt-2 right-0 z-50 rounded-xl overflow-hidden"
          style={{
            width: 320,
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(21,101,192,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <div className="flex items-center gap-2">
              <Settings2 size={13} style={{ color: "#1565C0" }} />
              <span
                className="text-xs font-bold"
                style={{
                  color: "#003087",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {STOCK_COLUMN_CUSTOMIZER_LABELS.panelTitle}
              </span>
            </div>
            <button
              onClick={resetCustomization}
              className="flex items-center gap-1 text-xs cursor-pointer transition-colors"
              style={{
                color: "#1565C0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              <RotateCcw size={10} /> {STOCK_COLUMN_CUSTOMIZER_LABELS.reset}
            </button>
          </div>

          <div className="px-4 py-2" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              {STOCK_COLUMN_CUSTOMIZER_LABELS.hintText}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {GROUPS.map((group) => (
              <div key={group} className="mb-1">
                <div className="px-4 py-1.5">
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "#111827",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {STOCK_COL_GROUP_LABELS[group]}
                  </span>
                </div>
                {STOCK_COLUMN_DEFS.filter((c) => c.group === group).map(
                  (col) => {
                    const isHidden = hiddenCols.has(col.id);
                    return (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 pl-6 pr-3 py-1.5 select-none"
                      >
                        <span
                          className="flex-1 text-xs truncate"
                          style={{
                            color: isHidden ? "#9ca3af" : "#374151",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            textDecoration: isHidden ? "line-through" : "none",
                          }}
                        >
                          {col.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCol(col.id)}
                          className="shrink-0 cursor-pointer transition-colors"
                          style={{ color: "#1565C0" }}
                          title={
                            isHidden
                              ? STOCK_COLUMN_CUSTOMIZER_LABELS.showColumn
                              : STOCK_COLUMN_CUSTOMIZER_LABELS.hideColumn
                          }
                        >
                          {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            ))}
          </div>

          <div
            className="px-4 py-2.5 flex items-center justify-between"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <span
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              {visibleCount} visible · {hiddenCols.size} hidden
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: "#EDF5FA",
                color: "#374151",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(21,101,192,0.2)",
              }}
            >
              {STOCK_COLUMN_CUSTOMIZER_LABELS.done}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
