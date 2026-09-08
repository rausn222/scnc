import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export const FILTER_MAX_WIDTH = 128;

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  stacked = true,
  maxWidth = FILTER_MAX_WIDTH,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  stacked?: boolean;
  maxWidth?: number;
}) {
  const isToolbar = stacked && maxWidth > 0;

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
      minWidth: rect.width,
      width: "max-content",
      // Let the panel grow to fit the longest option in full (no truncation),
      // only capping it so it can't overflow past the right edge of the viewport.
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
        !(e.target as Element).closest("[data-filter-dropdown-panel]")
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

  const showSearch = true;

  const filtered = options.filter((o) => {
    if (!showSearch) return true;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.toLowerCase().includes(q);
  });

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch("");
  };

  const panel = open ? (
    <div
      data-filter-dropdown-panel
      className="rounded-lg overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: "1.5px solid #93c5fd",
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      {showSearch && (
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
      )}

      <ul className="max-h-[560px] overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li
            className="px-3 py-4 text-center text-xs"
            style={{ color: "#94a3b8" }}
          >
            No matches
          </li>
        ) : (
          filtered.map((opt) => {
            const selected = opt === value;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(opt)}
                  title={opt}
                  className="w-full text-left cursor-pointer px-3 py-1.5 text-xs whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: selected ? "#dbeafe" : "transparent",
                    color: selected ? "#1565C0" : "#111827",
                    fontWeight: selected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                    }
                  }}
                >
                  {opt}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={
        isToolbar
          ? "flex flex-col gap-1 shrink min-w-0"
          : stacked
            ? "flex flex-col items-start gap-1.5 w-full"
            : "flex items-center gap-1.5 shrink-0 whitespace-nowrap"
      }
      style={isToolbar ? { maxWidth, width: maxWidth } : undefined}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wide truncate w-full"
        style={{ color: "#374151" }}
        title={label}
      >
        {label}
      </span>
      <div className={`relative min-w-0 ${stacked ? "w-full" : ""}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!open) updatePanelPosition();
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={value}
          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs cursor-pointer focus:outline-none transition-all truncate text-left ${
            stacked ? "w-full" : ""
          }`}
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: open ? "#1565C0" : "#d1d5db",
            color: "#111827",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            maxWidth: isToolbar ? maxWidth : undefined,
          }}
        >
          {value}
        </button>
        <ChevronDown
          size={11}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#6b7280" }}
        />
      </div>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}

export interface MultiSelectOption {
  label: string;
  value: string;
}

/** Same look and positioning as `FilterDropdown`, but lets the user check off several
 * options at once instead of picking one — the panel stays open across selections. */
export function MultiSelectFilterDropdown({
  label,
  options,
  selected,
  onChange,
  stacked = true,
  maxWidth = FILTER_MAX_WIDTH,
  dense = false,
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  stacked?: boolean;
  maxWidth?: number;
  /** Shrinks label/value/option text a size below the default — for toolbars with many filters. */
  dense?: boolean;
}) {
  const isToolbar = stacked && maxWidth > 0;

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
      minWidth: rect.width,
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
        !(e.target as Element).closest("[data-filter-dropdown-panel]")
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

  const showSearch = true;

  const filtered = options.filter((o) => {
    if (!showSearch) return true;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return o.label.toLowerCase().includes(q);
  });

  const selectableOptions = options.filter((option) => option.value !== "All");
  const allSelected = selectableOptions.length > 0 && selectableOptions.every((option) => selected.includes(option.value));

  const toggleValue = (v: string) => {
    if (v === "All") {
      onChange([]);
      return;
    }
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  };

  const displayValue =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} selected`;

  const panel = open ? (
    <div
      data-filter-dropdown-panel
      className="rounded-lg overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: "1.5px solid #93c5fd",
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      {showSearch && (
        <div className="p-2" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="relative">
            <Search
              size={11}
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
      )}

      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : selectableOptions.map((option) => option.value))}
          className="text-xs font-semibold cursor-pointer"
          style={{ color: selected.length === 0 || allSelected ? "#1565C0" : "#6b7280" }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : selectableOptions.map((option) => option.value))}
          className="text-[11px] font-semibold cursor-pointer"
          style={{ color: "#6b7280" }}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      <ul className="max-h-[560px] overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
        {filtered.length === 0 ? (
          <li
            className="px-3 py-4 text-center text-xs"
            style={{ color: "#94a3b8" }}
          >
            No matches
          </li>
        ) : (
          filtered.map((opt) => {
            const checked = opt.value === "All" ? selected.length === 0 : selected.includes(opt.value);
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => opt.value === "All"
                    ? onChange(selected.length === 0 ? selectableOptions.map((option) => option.value) : [])
                    : toggleValue(opt.value)}
                  title={opt.label}
                  className={`w-full flex items-center gap-2 text-left cursor-pointer px-3 py-1.5 whitespace-nowrap transition-colors ${dense ? "text-[11px]" : "text-xs"}`}
                  style={{
                    backgroundColor: checked ? "#dbeafe" : "transparent",
                    color: checked ? "#1565C0" : "#111827",
                    fontWeight: checked ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!checked) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!checked) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0 rounded"
                    style={{
                      width: 14,
                      height: 14,
                      border: `1.5px solid ${checked ? "#1565C0" : "#cbd5e1"}`,
                      backgroundColor: checked ? "#1565C0" : "transparent",
                    }}
                  >
                    {checked && <Check size={10} color="#ffffff" strokeWidth={3} />}
                  </span>
                  {opt.label}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={
        isToolbar
          ? "flex flex-col gap-1 shrink min-w-0"
          : stacked
            ? "flex flex-col items-start gap-1.5 w-full"
            : "flex items-center gap-1.5 shrink-0 whitespace-nowrap"
      }
      style={isToolbar ? { maxWidth, width: maxWidth } : undefined}
    >
      <span
        className={`font-semibold uppercase tracking-wide truncate w-full ${dense ? "text-[9px]" : "text-xs"}`}
        style={{ color: "#374151" }}
        title={label}
      >
        {label}
      </span>
      <div className={`relative min-w-0 ${stacked ? "w-full" : ""}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!open) updatePanelPosition();
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          title={displayValue}
          className={`appearance-none pl-2.5 pr-7 rounded-full cursor-pointer focus:outline-none transition-all truncate text-left ${
            dense ? "py-0.5 text-[11px]" : "py-1 text-xs"
          } ${stacked ? "w-full" : ""}`}
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: open ? "#1565C0" : "#d1d5db",
            color: "#111827",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            maxWidth: isToolbar ? maxWidth : undefined,
          }}
        >
          {displayValue}
        </button>
        <ChevronDown
          size={11}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#6b7280" }}
        />
      </div>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}

export function FilterToggle({
  label,
  value,
  options,
  onChange,
  maxWidth = FILTER_MAX_WIDTH,
  activeColor = "#1565C0",
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  maxWidth?: number;
  activeColor?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 shrink min-w-0"
      style={{ maxWidth, width: maxWidth }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-wide truncate w-full"
        style={{ color: "#374151" }}
        title={label}
      >
        {label}
      </span>
      <div
        className="flex rounded-full overflow-hidden text-xs w-full"
        style={{
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#d1d5db",
        }}
      >
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex-1 min-w-0 px-1.5 py-1 cursor-pointer transition-colors font-medium truncate"
              style={{
                backgroundColor: active ? activeColor : "#ffffff",
                color: active ? "#ffffff" : "#374151",
                fontSize: 10,
              }}
              title={opt.label}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
