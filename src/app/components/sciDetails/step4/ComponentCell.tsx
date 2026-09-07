import type { ComponentBreakdownRow } from "../types";
import { C } from "../constants";

export function ComponentCell({ comp }: { comp: ComponentBreakdownRow }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold truncate" style={{ color: "#111827" }}>
          {comp.component}
        </span>
        <span
          className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{
            backgroundColor: comp.type === "PM" ? C.bgBlue : "#ecfdf5",
            color: comp.type === "PM" ? C.blue : C.teal,
          }}
        >
          {comp.type}
        </span>
      </div>
      <p
        className="text-xs mt-0.5 truncate"
        style={{ color: "#64748b" }}
        title={comp.description}
      >
        {comp.description}
      </p>
      {comp.isBottleneck && (
        <span
          className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
          style={{ backgroundColor: "#ffedd5", color: "#ea580c" }}
        >
          Bottleneck
        </span>
      )}
    </div>
  );
}
