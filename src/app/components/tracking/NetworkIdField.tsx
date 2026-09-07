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
import { C } from "../actionDetails/theme";

/**
 * Single-select Network ID picker — same pill/clear/chevron visual language as
 * `CbuDropdownField`/`ProjectNameField` so the four Project Selection fields read as one
 * consistent row.
 */
export function NetworkIdField({
  value,
  options,
  onChange,
  onClear,
}: Readonly<{
  value: string | null;
  options: string[];
  onChange: (id: string) => void;
  onClear: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return options;
    }

    return options.filter((option) =>
      option.toLowerCase().includes(q),
    );
  }, [options, search]);
  const closePanel = () => {
    setOpen(false);
    setSearch("");
  };

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
        !(e.target as Element).closest("[data-network-id-panel]")
      ) {
        closePanel();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
    closePanel();
  };

  const displayValue = value ?? "Select Network ID";

  const panel = open ? (
    <div
      data-network-id-panel
      className="rounded-lg overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: "1.5px solid #93c5fd",
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      <div
        className="p-2"
        style={{
          borderBottom: "1px solid #e5e7eb",
        }}
      >
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
            placeholder="Search Network ID"
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

      <ul
        className="max-h-[320px] overflow-y-auto py-1"
        role="listbox"
      >
        {filteredOptions.length === 0 ? (
          <li
            className="px-3 py-4 text-center text-xs"
            style={{ color: "#94a3b8" }}
          >
            No matches
          </li>
        ) : (
          filteredOptions.map((opt) => {
            const selected = value === opt;

            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    closePanel();
                  }}
                  title={opt}
                  className="w-full text-left cursor-pointer px-3 py-2 text-xs whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: selected
                      ? "#dbeafe"
                      : "transparent",
                    color: selected
                      ? C.blue
                      : "#111827",
                    fontWeight: selected
                      ? 600
                      : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor =
                        "#f8fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor =
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
    <div ref={containerRef} className="relative w-full min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: "#374151" }}>
        Network ID
      </p>
      <div className="relative w-full min-w-0">
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
          className="w-full appearance-none pl-2.5 pr-7 py-1.5 rounded-full text-xs cursor-pointer focus:outline-none transition-all truncate text-left"
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: open ? C.blue : "#d1d5db",
            color: value ? "#111827" : "#94a3b8",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          {displayValue}
        </button>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleClear(e as unknown as React.MouseEvent);
            }}
            title="Clear Network ID"
            className="absolute right-6 top-1/2 -translate-y-1/2 shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "#94a3b8" }}
          >
            <X size={11} />
          </span>
        )}
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
