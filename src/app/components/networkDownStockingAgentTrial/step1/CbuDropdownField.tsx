import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { type CBURow } from "../../data";
import { C } from "../../sciDetails/constants";
import { useCbuListQuery } from "../../../queries/cbuQueries";

function formatCbuLabel(row: Pick<CBURow, "cbuCode" | "cbuDescription">) {
  return `${row.cbuCode}: ${row.cbuDescription}`;
}

function OptionCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className="shrink-0 flex items-center justify-center rounded-[3px]"
      style={{
        width: 14,
        height: 14,
        border: checked ? `1.5px solid ${C.blue}` : "1.5px solid #cbd5e1",
        backgroundColor: checked ? C.blue : "#ffffff",
      }}
      aria-hidden
    >
      {checked && <Check size={10} color="#ffffff" strokeWidth={3} />}
    </span>
  );
}

/**
 * Multi-select CBU picker. Selection is fully controlled via `selectedSrNos`
 * + `onChange` so the trigger's box size stays fixed no matter how many CBUs
 * are picked (a truncated summary label, not growing chips), and picking an
 * option doesn't close the panel — several can be toggled in one open.
 */
export function CbuDropdownField({
  label,
  selectedSrNos,
  onChange,
  placeholder = "Select a CBU",
  disabled = false,
  disabledPlaceholder = "Select Old CBU first",
  excludeSrNos,
  multiSelect = true,
}: {
  label: string;
  selectedSrNos: number[];
  onChange: (next: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  excludeSrNos?: number[];
  multiSelect?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: Math.max(rect.width, 280),
      width: "max-content",
      maxWidth: Math.max(rect.width, window.innerWidth - rect.left - 16),
      zIndex: 9999,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-cbu-dropdown-panel]")
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const { data: cbuListData } = useCbuListQuery();
  const cbuData = cbuListData ?? [];

  const selectedSet = useMemo(() => new Set(selectedSrNos), [selectedSrNos]);
  const selectedRows = useMemo(
    () => selectedSrNos.map((sr) => cbuData.find((r) => r.srNo === sr)).filter((r): r is CBURow => !!r),
    [selectedSrNos, cbuData],
  );

  const excludeSet = useMemo(() => new Set(excludeSrNos ?? []), [excludeSrNos]);
  const pickableData = excludeSet.size === 0 ? cbuData : cbuData.filter((item) => !excludeSet.has(item.srNo));

  const filtered = pickableData.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.cbuCode.toLowerCase().includes(q) ||
      item.cbuDescription.toLowerCase().includes(q) ||
      formatCbuLabel(item).toLowerCase().includes(q)
    );
  });
  const filteredIds = filtered.map((f) => f.srNo);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedSet.has(id));

  const closePanel = () => {
    setOpen(false);
    setSearch("");
  };

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      const removeSet = new Set(filteredIds);
      onChange(selectedSrNos.filter((id) => !removeSet.has(id)));
    } else {
      onChange(Array.from(new Set([...selectedSrNos, ...filteredIds])));
    }
  };

  const handleOptionClick = (srNo: number) => {
    if (!multiSelect) {
      onChange([srNo]);

      // Close dropdown after selection for single-select controls
      closePanel();
      return;
    }

    onChange(
      selectedSet.has(srNo)
        ? selectedSrNos.filter((id) => id !== srNo)
        : [...selectedSrNos, srNo],
    );
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    closePanel();
  };

  const displayValue =
    selectedRows.length === 0
      ? disabled
        ? disabledPlaceholder
        : placeholder
      : selectedRows.length === 1
        ? formatCbuLabel(selectedRows[0])
        : `${selectedRows.length} selected — ${selectedRows.map((r) => r.cbuCode).join(", ")}`;

  const panel = open ? (
    <div
      data-cbu-dropdown-panel
      className="rounded-lg overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: "1.5px solid #93c5fd",
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      <div className="p-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#94a3b8" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            title={`Search ${label}`}
            placeholder="Search"
            className="w-full pl-7 pr-2.5 py-1.5 rounded-md text-xs focus:outline-none"
            style={{
              border: "1.5px solid #93c5fd",
              color: "#111827",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {multiSelect && (
        <button
          type="button"
          onClick={handleToggleAll}
          title={
            allFilteredSelected
              ? "Deselect all listed CBUs"
              : "Select all listed CBUs"
          }
          className="w-full flex items-center gap-2 text-left cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap transition-colors"
          style={{
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: allFilteredSelected ? "#dbeafe" : "transparent",
            color: allFilteredSelected ? C.blue : "#111827",
            fontWeight: 600,
          }}
        >
          <OptionCheckbox checked={allFilteredSelected} />
          All
          <span
            className="ml-auto font-normal"
            style={{ color: "#94a3b8" }}
          >
            {selectedSrNos.length} selected
          </span>
        </button>
      )}

      <ul className="max-h-[320px] overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs" style={{ color: "#94a3b8" }}>
            No matches
          </li>
        ) : (
          filtered.map((item) => {
            const selected = selectedSet.has(item.srNo);
            const labelText = formatCbuLabel(item);
            return (
              <li key={item.srNo}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleOptionClick(item.srNo)}
                  title={
                    selected
                      ? `Deselect CBU ${item.cbuCode}`
                      : `Select ${labelText}`
                  }
                  className="w-full flex items-center gap-2 text-left cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: selected ? "#dbeafe" : "transparent",
                    color: selected ? C.blue : "#111827",
                    fontWeight: selected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {multiSelect && (
                    <OptionCheckbox checked={selected} />
                  )}

                  <span>{labelText}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <p
        className="text-[10px] font-semibold uppercase tracking-wide mb-1 truncate"
        style={{ color: disabled ? "#94a3b8" : "#374151" }}
        title={label}
      >
        {label}
      </p>
      <div className="relative w-full min-w-0">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (disabled) return;
            if (!open) updatePanelPosition();
            setOpen((o) => !o);
          }}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={displayValue}
          className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-full text-xs cursor-pointer focus:outline-none transition-all truncate text-left"
          style={{
            backgroundColor: disabled ? "#f8fafc" : "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: disabled ? "#e2e8f0" : open ? C.blue : "#d1d5db",
            color: disabled ? "#cbd5e1" : selectedRows.length > 0 ? "#111827" : "#94a3b8",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {displayValue}
        </button>
        {selectedRows.length > 0 && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClearAll}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClearAll(e as unknown as React.MouseEvent);
            }}
            title={`Clear all selected ${label}`}
            className="absolute right-6 top-1/2 -translate-y-1/2 shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "#94a3b8" }}
          >
            <X size={11} />
          </span>
        )}
        <ChevronDown
          size={11}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: disabled ? "#cbd5e1" : "#6b7280" }}
        />
      </div>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}
