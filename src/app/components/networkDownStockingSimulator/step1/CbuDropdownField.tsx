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

// Panel chrome/tints with no matching C.* token — kept file-local so parallel
// edits to constants.ts don't conflict (see step1 refactor notes).
const PANEL_BORDER = `1.5px solid ${C.borderBlue}`;
const PANEL_SHADOW = "0 8px 24px rgba(21,101,192,0.15)";
const DIVIDER_BORDER = "1px solid #e5e7eb";
const SELECTED_OPTION_BG = "#dbeafe";
const DEFAULT_TRIGGER_BORDER = "#d1d5db";
const FONT_FAMILY = "'Plus Jakarta Sans', sans-serif";
// Panel is portaled to document.body, so it must out-rank all page content.
const DROPDOWN_PANEL_Z_INDEX = 9999;

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
        border: checked ? `1.5px solid ${C.blue}` : `1.5px solid ${C.borderLight}`,
        backgroundColor: checked ? C.blue : C.white,
      }}
      aria-hidden
    >
      {checked && <Check size={10} color={C.white} strokeWidth={3} />}
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
      zIndex: DROPDOWN_PANEL_Z_INDEX,
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
        backgroundColor: C.white,
        border: PANEL_BORDER,
        boxShadow: PANEL_SHADOW,
      }}
    >
      <div className="p-2" style={{ borderBottom: DIVIDER_BORDER }}>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: C.borderMuted }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            title={`Search ${label}`}
            placeholder="Search"
            className="w-full pl-7 pr-2.5 py-1.5 rounded-md text-xs focus:outline-none"
            style={{
              border: PANEL_BORDER,
              color: C.text,
              fontFamily: FONT_FAMILY,
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
            borderBottom: DIVIDER_BORDER,
            backgroundColor: allFilteredSelected ? SELECTED_OPTION_BG : "transparent",
            color: allFilteredSelected ? C.blue : C.text,
            fontWeight: 600,
          }}
        >
          <OptionCheckbox checked={allFilteredSelected} />
          All
          <span
            className="ml-auto font-normal"
            style={{ color: C.borderMuted }}
          >
            {selectedSrNos.length} selected
          </span>
        </button>
      )}

      <ul className="max-h-[320px] overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs" style={{ color: C.borderMuted }}>
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
                    backgroundColor: selected ? SELECTED_OPTION_BG : "transparent",
                    color: selected ? C.blue : C.text,
                    fontWeight: selected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = C.bgSlateLight;
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
        style={{ color: disabled ? C.borderMuted : C.textSecondary }}
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
            backgroundColor: disabled ? C.bgSlateLight : C.white,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: disabled ? C.border : open ? C.blue : DEFAULT_TRIGGER_BORDER,
            color: disabled ? C.borderLight : selectedRows.length > 0 ? C.text : C.borderMuted,
            fontFamily: FONT_FAMILY,
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
            style={{ color: C.borderMuted }}
          >
            <X size={11} />
          </span>
        )}
        <ChevronDown
          size={11}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: disabled ? C.borderLight : C.mutedLight }}
        />
      </div>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}
