import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Settings2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  ALL_COLS,
  DEFAULT_GROUP_ORDER,
  DEFAULT_HIDDEN_COLS,
  G,
  G_LABEL,
  COLUMN_CUSTOMIZER_LABELS,
} from "../../constants/nationalDashboard";
import { buildDefaultColOrderByGroup, countVisibleColumns } from "./utils";
import type { ColDragTarget, ColumnGroup } from "./types";

export function ColumnCustomizer({
  groupOrder,
  setGroupOrder,
  colOrderByGroup,
  setColOrderByGroup,
  hiddenGroups,
  setHiddenGroups,
  hiddenCols,
  setHiddenCols,
}: {
  groupOrder: ColumnGroup[];
  setGroupOrder: React.Dispatch<React.SetStateAction<ColumnGroup[]>>;
  colOrderByGroup: Record<ColumnGroup, string[]>;
  setColOrderByGroup: React.Dispatch<
    React.SetStateAction<Record<ColumnGroup, string[]>>
  >;
  hiddenGroups: Set<ColumnGroup>;
  setHiddenGroups: React.Dispatch<React.SetStateAction<Set<ColumnGroup>>>;
  hiddenCols: Set<string>;
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<ColumnGroup>>(
    () => new Set(DEFAULT_GROUP_ORDER),
  );
  const [dragGroupIdx, setDragGroupIdx] = useState<number | null>(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState<number | null>(
    null,
  );
  const [dragCol, setDragCol] = useState<ColDragTarget | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColDragTarget | null>(null);
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

  function toggleGroupExpanded(group: ColumnGroup) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function toggleGroupVisibility(group: ColumnGroup) {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  function toggleCol(id: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function onGroupDragStart(index: number) {
    setDragGroupIdx(index);
    setDragCol(null);
  }

  function onGroupDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverGroupIdx(index);
  }

  function onGroupDrop(index: number) {
    if (dragGroupIdx === null || dragGroupIdx === index) {
      setDragGroupIdx(null);
      setDragOverGroupIdx(null);
      return;
    }
    setGroupOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragGroupIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragGroupIdx(null);
    setDragOverGroupIdx(null);
  }

  function onColDragStart(group: ColumnGroup, index: number) {
    setDragCol({ group, index });
    setDragGroupIdx(null);
  }

  function onColDragOver(e: React.DragEvent, group: ColumnGroup, index: number) {
    e.preventDefault();
    if (dragCol?.group === group) {
      setDragOverCol({ group, index });
    }
  }

  function onColDrop(group: ColumnGroup, index: number) {
    if (!dragCol || dragCol.group !== group || dragCol.index === index) {
      setDragCol(null);
      setDragOverCol(null);
      return;
    }
    setColOrderByGroup((prev) => {
      const groupCols = [...prev[group]];
      const [moved] = groupCols.splice(dragCol.index, 1);
      groupCols.splice(index, 0, moved);
      return { ...prev, [group]: groupCols };
    });
    setDragCol(null);
    setDragOverCol(null);
  }

  function resetCustomization() {
    setGroupOrder(DEFAULT_GROUP_ORDER);
    setColOrderByGroup(buildDefaultColOrderByGroup());
    setHiddenGroups(new Set());
    setHiddenCols(new Set(DEFAULT_HIDDEN_COLS));
    setExpandedGroups(new Set(DEFAULT_GROUP_ORDER));
  }

  const visibleColCount = countVisibleColumns(
    groupOrder,
    colOrderByGroup,
    hiddenGroups,
    hiddenCols,
  );
  const totalColCount = ALL_COLS.length;
  const visibleGroupCount = groupOrder.filter((g) => !hiddenGroups.has(g)).length;

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
        {COLUMN_CUSTOMIZER_LABELS.toggleButton}
        <span
          className="px-1.5 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: "rgba(21,101,192,0.15)",
            color: "#1565C0",
            fontSize: 9,
          }}
        >
          {visibleColCount}/{totalColCount}
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
            width: 340,
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
                {COLUMN_CUSTOMIZER_LABELS.panelTitle}
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
              <RotateCcw size={10} /> {COLUMN_CUSTOMIZER_LABELS.reset}
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
              {COLUMN_CUSTOMIZER_LABELS.hintText}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto py-2">
            {groupOrder.map((group, groupIdx) => {
              const isGroupHidden = hiddenGroups.has(group);
              const isExpanded = expandedGroups.has(group);
              const isGroupDragging = dragGroupIdx === groupIdx;
              const isGroupOver = dragOverGroupIdx === groupIdx;
              const groupColIds = colOrderByGroup[group] ?? [];
              const visibleInGroup = groupColIds.filter(
                (id) => !hiddenCols.has(id),
              ).length;

              return (
                <div key={group} className="mb-1">
                  <div
                    draggable
                    onDragStart={() => onGroupDragStart(groupIdx)}
                    onDragOver={(e) => onGroupDragOver(e, groupIdx)}
                    onDrop={() => onGroupDrop(groupIdx)}
                    onDragEnd={() => {
                      setDragGroupIdx(null);
                      setDragOverGroupIdx(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-grab transition-all select-none"
                    style={{
                      opacity: isGroupDragging ? 0.45 : 1,
                      backgroundColor: isGroupOver
                        ? "rgba(21,101,192,0.08)"
                        : isGroupHidden
                          ? "rgba(0,0,0,0.03)"
                          : "transparent",
                      borderLeft: isGroupOver
                        ? "3px solid #1565C0"
                        : "3px solid transparent",
                    }}
                  >
                    <GripVertical
                      size={13}
                      style={{ color: "rgba(0,48,135,0.35)", flexShrink: 0 }}
                    />
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: G[group].hdr }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleGroupExpanded(group)}
                      className="shrink-0 p-0.5 rounded cursor-pointer transition-colors"
                      style={{ color: "#64748b" }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    <span
                      className="flex-1 text-xs font-semibold truncate text-left"
                      style={{
                        color: isGroupHidden ? "#9ca3af" : "#111827",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        textDecoration: isGroupHidden ? "line-through" : "none",
                      }}
                    >
                      {G_LABEL[group]}
                    </span>
                    <span
                      className="text-[9px] shrink-0 px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(21,101,192,0.08)",
                        color: "#1565C0",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isGroupHidden ? 0 : visibleInGroup}/{groupColIds.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGroupVisibility(group)}
                      className="shrink-0 cursor-pointer transition-colors"
                      style={{ color: "#1565C0" }}
                      title={
                        isGroupHidden
                          ? COLUMN_CUSTOMIZER_LABELS.showSection
                          : COLUMN_CUSTOMIZER_LABELS.hideSection
                      }
                    >
                      {isGroupHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  {isExpanded &&
                    groupColIds.map((colId, colIdx) => {
                      const col = ALL_COLS.find((c) => c.id === colId);
                      if (!col) return null;
                      const isColHidden = isGroupHidden || hiddenCols.has(colId);
                      const isColDragging =
                        dragCol?.group === group && dragCol.index === colIdx;
                      const isColOver =
                        dragOverCol?.group === group && dragOverCol.index === colIdx;

                      return (
                        <div
                          key={colId}
                          draggable={!isGroupHidden}
                          onDragStart={() => onColDragStart(group, colIdx)}
                          onDragOver={(e) => onColDragOver(e, group, colIdx)}
                          onDrop={() => onColDrop(group, colIdx)}
                          onDragEnd={() => {
                            setDragCol(null);
                            setDragOverCol(null);
                          }}
                          className="flex items-center gap-2 pl-9 pr-3 py-1.5 transition-all select-none"
                          style={{
                            opacity: isColDragging ? 0.45 : isGroupHidden ? 0.5 : 1,
                            cursor: isGroupHidden ? "not-allowed" : "grab",
                            backgroundColor: isColOver
                              ? "rgba(21,101,192,0.06)"
                              : "transparent",
                            borderLeft: isColOver
                              ? "3px solid #90caf9"
                              : "3px solid transparent",
                          }}
                        >
                          <GripVertical
                            size={11}
                            style={{ color: "rgba(0,48,135,0.25)", flexShrink: 0 }}
                          />
                          <span
                            className="flex-1 text-xs truncate"
                            style={{
                              color: isColHidden ? "#9ca3af" : "#374151",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              textDecoration: isColHidden ? "line-through" : "none",
                            }}
                          >
                            {col.label}
                          </span>
                          <button
                            type="button"
                            disabled={isGroupHidden}
                            onClick={() => toggleCol(colId)}
                            className="shrink-0 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ color: "#1565C0" }}
                            title={
                              isColHidden
                                ? COLUMN_CUSTOMIZER_LABELS.showColumn
                                : COLUMN_CUSTOMIZER_LABELS.hideColumn
                            }
                          >
                            {isColHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
                      );
                    })}
                </div>
              );
            })}
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
              {visibleGroupCount}/{groupOrder.length} sections ·{" "}
              {visibleColCount} visible · {hiddenCols.size} cols hidden
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
              {COLUMN_CUSTOMIZER_LABELS.done}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
