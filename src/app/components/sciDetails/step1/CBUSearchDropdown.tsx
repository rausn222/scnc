import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Box, Check, ChevronDown, Search } from "lucide-react";
import { type CBURow } from "../../data";
import { C } from "../constants";
import { useCbuListQuery } from "../../../queries/cbuQueries";

export function CBUSearchDropdown({
  label,
  row,
  onSelect,
  placeholder = "Select a CBU",
  disabled = false,
}: {
  label: string;
  row: CBURow | null;
  onSelect: (srNo: number) => void;
  placeholder?: string;
  disabled?: boolean;
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
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const { data: cbuListData } = useCbuListQuery();
  const cbuData = cbuListData ?? [];

  const filtered = cbuData.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.cbuCode.toLowerCase().includes(q) ||
      item.cbuDescription.toLowerCase().includes(q)
    );
  });

  const handleSelect = (srNo: number) => {
    onSelect(srNo);
    setOpen(false);
    setSearch("");
  };

  const panel = open ? (
    <div
      data-cbu-dropdown-panel
      className="rounded-xl overflow-hidden"
      style={{
        ...panelStyle,
        backgroundColor: "#ffffff",
        border: `1.5px solid ${C.borderBlue}`,
        boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
      }}
    >
      <div className="p-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#94a3b8" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            title="Search CBUs by code or description"
            placeholder="Search by code or description"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              border: `1.5px solid ${C.borderBlue}`,
              color: "#111827",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
        {filtered.length === 0 ? (
          <li
            className="px-4 py-6 text-center text-sm"
            style={{ color: "#94a3b8" }}
          >
            No CBU found
          </li>
        ) : (
          filtered.map((item) => {
            const selected = row != null && item.srNo === row.srNo;
            return (
              <li key={item.srNo}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(item.srNo)}
                  title={`Select CBU ${item.cbuCode} — ${item.cbuDescription}`}
                  className="w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    backgroundColor: selected ? C.bgBlue : "transparent",
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
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: selected ? "#dbeafe" : "#f1f5f9",
                      color: selected ? C.blue : "#94a3b8",
                    }}
                  >
                    <Box size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: selected ? C.blue : "#111827" }}
                    >
                      {item.cbuCode}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "#64748b" }}
                    >
                      {item.cbuDescription}
                    </p>
                  </div>
                  {selected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: C.blue }}
                    >
                      <Check size={12} color="#ffffff" strokeWidth={3} />
                    </div>
                  )}
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
        className="text-xs font-semibold mb-1.5"
        style={{ color: disabled ? "#94a3b8" : C.navy }}
      >
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={disabled ? "Select Old CBU first" : row ? `${row.cbuCode} — click to change` : placeholder}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
        style={{
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          border: `1.5px solid ${disabled ? "#e2e8f0" : open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: disabled ? "none" : open ? "0 4px 16px rgba(21,101,192,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: disabled ? "#f1f5f9" : C.bgBlue, color: disabled ? "#cbd5e1" : C.blue }}
        >
          <Box size={18} />
        </div>
        <div className="flex-1 min-w-0">
          {row ? (
            <>
              <p
                className="font-bold text-sm truncate"
                style={{ color: C.blue }}
              >
                {row.cbuCode}
              </p>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "#64748b" }}
              >
                {row.cbuDescription}
              </p>
            </>
          ) : (
            <p className="font-medium text-sm" style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }}>
              {disabled ? "Select Old CBU first" : placeholder}
            </p>
          )}
        </div>
        <ChevronDown size={18} style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }} className="shrink-0" />
      </button>

      {panel && createPortal(panel, document.body)}
    </div>
  );
}
