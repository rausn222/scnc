import { ChevronDown } from "lucide-react";

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

  return (
    <div
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
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs cursor-pointer focus:outline-none transition-all truncate ${
            stacked ? "w-full" : ""
          }`}
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#d1d5db",
            color: "#111827",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            maxWidth: isToolbar ? maxWidth : undefined,
          }}
          title={value}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={11}
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#6b7280" }}
        />
      </div>
    </div>
  );
}

export function FilterToggle({
  label,
  value,
  options,
  onChange,
  maxWidth = FILTER_MAX_WIDTH,
  activeColor = "#00695C",
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
              className="flex-1 min-w-0 px-1.5 py-1 transition-colors font-medium truncate"
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
