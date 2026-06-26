import React from "react";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  ListFilter,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { FilterDropdown } from "./FilterDropdown";

export type FilterId =
  | "bg"
  | "smallC"
  | "format"
  | "materialType"
  | "uom"
  | "brand"
  | "materialCode"
  | "materialDescription"
  | "cbuCode"
  | "cbuDescription"
  | "basePack"
  | "basePackDescription";

export interface FilterDefinition {
  id: FilterId;
  label: string;
  kind: "dropdown" | "toggle";
}

export const ALL_FILTER_DEFINITIONS: FilterDefinition[] = [
  { id: "bg", label: "BG", kind: "dropdown" },
  { id: "smallC", label: "SMALL C", kind: "dropdown" },
  { id: "format", label: "FORMAT", kind: "dropdown" },
  { id: "materialType", label: "Material Type", kind: "toggle" },
  { id: "uom", label: "UOM", kind: "toggle" },
  { id: "brand", label: "Brand", kind: "dropdown" },
  { id: "materialCode", label: "Material Code", kind: "dropdown" },
  {
    id: "materialDescription",
    label: "Material Description",
    kind: "dropdown",
  },
  { id: "cbuCode", label: "CBU Code", kind: "dropdown" },
  { id: "cbuDescription", label: "CBU Description", kind: "dropdown" },
  { id: "basePack", label: "Base Pack", kind: "dropdown" },
  {
    id: "basePackDescription",
    label: "Base Pack Description",
    kind: "dropdown",
  },
];

export const DEFAULT_FILTER_ORDER: FilterId[] = ALL_FILTER_DEFINITIONS.map(
  (f) => f.id,
);

export const MAX_VISIBLE_FILTERS = 6;

export const DEFAULT_VISIBLE_FILTER_IDS: FilterId[] = [
  "bg",
  "smallC",
  "format",
  "materialType",
  "uom",
  "brand",
  "basePack",
  "basePackDescription"
];

const FILTER_LABEL: Record<FilterId, string> = Object.fromEntries(
  ALL_FILTER_DEFINITIONS.map((f) => [f.id, f.label]),
) as Record<FilterId, string>;

interface Props {
  filterOrder: FilterId[];
  setFilterOrder: React.Dispatch<React.SetStateAction<FilterId[]>>;
  visibleFilters: Set<FilterId>;
  setVisibleFilters: React.Dispatch<React.SetStateAction<Set<FilterId>>>;
  activeHiddenCount: number;
  dropdownFilters: Record<FilterId, string>;
  onDropdownChange: (id: FilterId, value: string) => void;
  getFilterOptions: (id: FilterId) => string[];
}

export function MoreFiltersPanel({
  filterOrder,
  setFilterOrder,
  visibleFilters,
  setVisibleFilters,
  activeHiddenCount,
  dropdownFilters,
  onDropdownChange,
  getFilterOptions,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toggleVisibility(id: FilterId) {
    const isVisible = visibleFilters.has(id);

    if (!isVisible && visibleFilters.size >= MAX_VISIBLE_FILTERS) {
      toast("Hide any existing one to show any other", {
        description: `Only ${MAX_VISIBLE_FILTERS} filters can appear in the toolbar at once.`,
      });
      return;
    }

    setVisibleFilters((prev) => {
      const next = new Set(prev);
      if (isVisible) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetFilters() {
    setFilterOrder(DEFAULT_FILTER_ORDER);
    setVisibleFilters(new Set(DEFAULT_VISIBLE_FILTER_IDS));
  }

  function onDragStart(index: number) {
    setDragIdx(index);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIdx(index);
  }

  function onDrop(index: number) {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setFilterOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  const hiddenFilterCount = filterOrder.length - visibleFilters.size;
  const hiddenDropdownFilters = filterOrder.filter(
    (id) =>
      !visibleFilters.has(id) &&
      ALL_FILTER_DEFINITIONS.find((f) => f.id === id)?.kind === "dropdown",
  );

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
        style={{
          backgroundColor: open
            ? "rgba(21,101,192,0.14)"
            : "#ffffff",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: open ? "#1565C0" : "#d1d5db",
          color: "#374151",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <ListFilter size={12} style={{ color: "#1565C0" }} />
        More Filters
        {hiddenFilterCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(21,101,192,0.12)",
              color: "#1565C0",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            +{hiddenFilterCount}
          </span>
        )}
        {activeHiddenCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "#00695C",
              color: "#ffffff",
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {activeHiddenCount} active
          </span>
        )}
        <ChevronDown
          size={11}
          style={{
            color: "#6b7280",
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s",
          }}
        />
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
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
              <ListFilter size={13} style={{ color: "#1565C0" }} />
              <span
                className="text-xs font-bold"
                style={{
                  color: "#003087",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Manage Filters
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs"
              style={{
                color: "#1565C0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          <div
            className="px-4 py-2"
            style={{ borderBottom: "1px solid #f3f4f6" }}
          >
            <p
              style={{
                color: "#6b7280",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
              }}
            >
              DRAG TO REORDER · TOGGLE TO SHOW IN TOOLBAR · MAX {MAX_VISIBLE_FILTERS} VISIBLE
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {filterOrder.map((id, index) => {
              const isVisible = visibleFilters.has(id);
              const isDragging = dragIdx === index;
              const isOver = dragOverIdx === index;
              const isDefault = DEFAULT_VISIBLE_FILTER_IDS.includes(id);

              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => {
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 cursor-grab transition-all select-none"
                  style={{
                    opacity: isDragging ? 0.45 : 1,
                    backgroundColor: isOver
                      ? "rgba(21,101,192,0.08)"
                      : "transparent",
                    borderLeft: isOver
                      ? "3px solid #1565C0"
                      : "3px solid transparent",
                  }}
                >
                  <GripVertical
                    size={13}
                    style={{
                      color: "rgba(0,48,135,0.35)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="flex-1 text-xs truncate"
                    style={{
                      color: isVisible ? "#111827" : "#9ca3af",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textDecoration: isVisible ? "none" : "line-through",
                      fontWeight: isVisible ? 600 : 400,
                    }}
                  >
                    {FILTER_LABEL[id]}
                  </span>
                  {isDefault && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: "rgba(21,101,192,0.08)",
                        color: "#1565C0",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      default
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleVisibility(id)}
                    className="shrink-0"
                    style={{ color: "#1565C0" }}
                    title={isVisible ? "Hide from toolbar" : "Show in toolbar"}
                  >
                    {isVisible ? (
                      <Eye size={13} />
                    ) : (
                      <EyeOff size={13} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* {hiddenDropdownFilters.length > 0 && (
            <div
              className="px-4 py-3 space-y-3"
              style={{
                borderTop: "1px solid #e5e7eb",
                backgroundColor: "#f8fafc",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748b" }}
              >
                Apply hidden filters
              </p>
              {hiddenDropdownFilters.map((id) => (
                <FilterDropdown
                  key={id}
                  label={FILTER_LABEL[id]}
                  value={dropdownFilters[id]}
                  options={getFilterOptions(id)}
                  onChange={(value) => onDropdownChange(id, value)}
                  stacked
                  maxWidth={0}
                />
              ))}
            </div>
          )} */}

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
              {visibleFilters.size} shown · {hiddenFilterCount} in More Filters
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1 rounded-lg"
              style={{
                backgroundColor: "#EDF5FA",
                color: "#374151",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "rgba(21,101,192,0.2)",
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
