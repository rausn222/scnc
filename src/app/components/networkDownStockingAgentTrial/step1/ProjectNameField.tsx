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
            title="Search project names"
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

      <ul className="max-h-[280px] overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-center text-xs" style={{ color: "#94a3b8" }}>
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
        style={{ color: disabled ? "#94a3b8" : "#374151" }}
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
            backgroundColor: disabled ? "#f8fafc" : "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: disabled ? "#e2e8f0" : open ? C.blue : "#d1d5db",
            color: disabled ? "#cbd5e1" : value.trim() ? "#111827" : "#94a3b8",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
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
