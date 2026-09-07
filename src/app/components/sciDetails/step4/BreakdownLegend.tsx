import { C } from "../constants";

export function BreakdownLegend() {
  const items = [
    { color: C.green, label: "No waste" },
    { color: "#ea580c", label: "Bottleneck" },
    { color: "#dc2626", label: "Leftover waste" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#64748b" }}>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
