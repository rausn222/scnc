import { useRef } from "react";
import { Calendar, X } from "lucide-react";
import { C } from "./constants";

export function AssumptionDateInput({
  value,
  onChange,
  min,
  required = false,
}: {
  value: string;
  onChange: (next: string) => void;
  min?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const empty = required && !value;
  return (
    <div className="relative inline-block shrink-0">
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs pl-3 py-1.5 rounded-lg w-40 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden ${value ? "pr-14" : "pr-8"}`}
        style={{
          border: `1px solid ${empty ? "#f87171" : "#d1d5db"}`,
          color: value ? C.navy : "#94a3b8",
        }}
      />
      {value && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange("")}
          title="Clear date"
          className="absolute right-7 cursor-pointer top-1/2 -translate-y-1/2"
          style={{ lineHeight: 0 }}
        >
          <X size={12} style={{ color: "#94a3b8" }} />
        </button>
      )}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => inputRef.current?.showPicker()}
        title="Open date picker"
        className="absolute right-2 cursor-pointer top-1/2 -translate-y-1/2"
        style={{ lineHeight: 0 }}
      >
        <Calendar size={14} style={{ color: "#94a3b8" }} />
      </button>
    </div>
  );
}
