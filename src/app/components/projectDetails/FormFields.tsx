import { ChevronDown } from "lucide-react";

export function Field({ label, span = 1, children }: { label: string; span?: 1 | 2; children: React.ReactNode }) {
  return (
    <label className={span === 2 ? "col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
      <span className="text-xs font-medium" style={{ color: "#374151" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
      style={{ border: "1px solid #d1d5db", color: "#111827" }}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={2}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none disabled:opacity-50 disabled:bg-gray-50"
      style={{ border: "1px solid #d1d5db", color: "#111827" }}
    />
  );
}

export function DateInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none disabled:opacity-50 disabled:bg-gray-50"
      style={{ border: "1px solid #d1d5db", color: "#111827" }}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 pr-8 rounded-lg text-sm focus:outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed"
        style={{ border: "1px solid #d1d5db", color: "#111827" }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94a3b8" }} />
    </div>
  );
}
