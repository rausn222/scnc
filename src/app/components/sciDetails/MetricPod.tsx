import { C } from "./constants";

export function MetricPod({
  label,
  value,
  valueColor = C.navy,
  muted = false,
  preview = false,
}: {
  label: string;
  value: string | null;
  valueColor?: string;
  muted?: boolean;
  preview?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-[100px] px-3 py-2 rounded-xl"
      style={{
        backgroundColor: preview ? "#f1f5f9" : "#f8fafc",
        border: preview ? "1px dashed #cbd5e1" : undefined,
      }}
    >
      <p
        className="text-[10px] font-semibold tracking-wide mb-0.5 uppercase"
        style={{ color: "#94a3b8" }}
      >
        {label}{preview ? " (projected)" : ""}
      </p>
      <p
        className="text-sm font-bold truncate"
        style={{
          color: muted
            ? preview
              ? "#94a3b8"
              : "#e2e8f0"
            : valueColor,
        }}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
