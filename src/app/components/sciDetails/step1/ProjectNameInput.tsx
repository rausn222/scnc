import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { C, PROJECT_NAME_OPTIONS } from "../constants";

export function ProjectNameInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
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
        !(e.target as Element).closest("[data-project-dropdown-panel]")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = PROJECT_NAME_OPTIONS.filter(
    (opt) => !value.trim() || opt.toLowerCase().includes(value.toLowerCase()),
  );

  const panel =
    open && filtered.length > 0 ? (
      <div
        data-project-dropdown-panel
        className="rounded-xl overflow-hidden"
        style={{
          ...panelStyle,
          backgroundColor: "#ffffff",
          border: `1.5px solid ${C.borderBlue}`,
          boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
        }}
      >
        <ul className="max-h-48 overflow-y-auto py-1" role="listbox">
          {filtered.map((opt) => {
            const selected = value === opt;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  title={`Select project name "${opt}"`}
                  className="w-full flex items-center cursor-pointer gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ backgroundColor: selected ? C.bgBlue : "transparent" }}
                  onMouseEnter={(e) => {
                    if (!selected)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="flex-1 text-sm"
                    style={{ color: selected ? C.blue : "#111827" }}
                  >
                    {opt}
                  </span>
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
          })}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <p className="text-xs font-semibold mb-1.5" style={{ color: disabled ? "#94a3b8" : C.navy }}>
        Project Name
      </p>
      <div
        ref={wrapperRef}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          border: `1.5px solid ${disabled ? "#e2e8f0" : open ? C.borderBlue : "#d1d5db"}`,
          boxShadow: disabled ? "none" : open ? "0 4px 16px rgba(21,101,192,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
          cursor: disabled ? "not-allowed" : undefined,
        }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: disabled ? "#f1f5f9" : C.bgBlue, color: disabled ? "#cbd5e1" : C.blue }}
        >
          <Sparkles size={18} />
        </div>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => { if (!disabled) setOpen(true); }}
          title={disabled ? "Select Old CBU first" : "Type or select a project name"}
          placeholder={disabled ? "Select Old CBU first" : "Type or select project name"}
          className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none"
          style={{ color: value ? "#111827" : undefined, cursor: disabled ? "not-allowed" : undefined }}
        />
        <ChevronDown size={18} style={{ color: disabled ? "#cbd5e1" : "#94a3b8" }} className="shrink-0" />
      </div>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}
