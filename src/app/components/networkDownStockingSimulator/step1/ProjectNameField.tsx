import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { C, PROJECT_NAME_OPTIONS } from "../../sciDetails/constants";

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

export function ProjectNameField({
  value,
  onChange,
  onClear,
  disabled = false,
  disabledPlaceholder = "Select Old CBU first",
  extraOptions = [],
}: {
  value: string;
  onChange: (name: string) => void;
  /** Enables the inline clear (×) affordance once a name is set. */
  onClear?: () => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  /** Newly created project names to surface alongside the built-in list. */
  extraOptions?: string[];
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
      minWidth: Math.max(rect.width, 220),
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
        !(e.target as Element).closest("[data-project-dropdown-panel]")
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

  const allOptions = useMemo(
    () => Array.from(new Set([...extraOptions, ...PROJECT_NAME_OPTIONS])),
    [extraOptions],
  );

  const filtered = allOptions.filter((opt) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return opt.toLowerCase().includes(q);
  });

  const clearValue = () => {
    if (onClear) onClear();
    else onChange("");
  };

  const closePanel = () => {
    setOpen(false);
    setSearch("");
  };

  const handleOptionClick = (opt: string) => {
    if (value === opt) {
      clearValue();
    } else {
      onChange(opt);
    }
    closePanel();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearValue();
    closePanel();
  };

  const displayValue = value.trim()
    ? value
    : disabled
      ? disabledPlaceholder
      : "Select project name";

  const panel = open ? (
    <div
      data-project-dropdown-panel
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
            title="Search project names"
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

      <ul className="max-h-[280px] overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs" style={{ color: C.borderMuted }}>
            No matches
          </li>
        ) : (
          filtered.map((opt) => {
            const selected = value === opt;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleOptionClick(opt)}
                  title={selected ? `Deselect "${opt}"` : `Select "${opt}"`}
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
    <div ref={containerRef} className="relative w-full min-w-0">
      <p
        className="text-[10px] font-semibold uppercase tracking-wide mb-1 truncate"
        style={{ color: disabled ? C.borderMuted : C.textSecondary }}
        title="Project Name"
      >
        Project Name
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
            color: disabled ? C.borderLight : value.trim() ? C.text : C.borderMuted,
            fontFamily: FONT_FAMILY,
            fontWeight: 500,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {displayValue}
        </button>
        {value.trim() && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleClear(e as unknown as React.MouseEvent);
              }
            }}
            title="Clear project name"
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
