import { C } from "./constants";

export function ToggleSwitch({
  checked,
  onChange,
  label,
  labelMuted = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  labelMuted?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer shrink-0">
      <span
        className="text-xs font-medium"
        style={{ color: labelMuted ? "#94a3b8" : "#64748b" }}
      >
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        title={`Toggle ${label}`}
        className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
        style={{ backgroundColor: checked ? C.blue : "#cbd5e1" }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </label>
  );
}
