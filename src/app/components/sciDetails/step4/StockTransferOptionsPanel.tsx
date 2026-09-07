import { useState } from "react";
import { ArrowLeftRight, Check, Clock, Link2Off, Star } from "lucide-react";
import { C, IUT_TRANSFER_OPTIONS, RM_BADGE, PM_BADGE } from "../constants";

export function StockTransferOptionsPanel({ count }: { count: number }) {
  const options = IUT_TRANSFER_OPTIONS.slice(0, count);
  const [selectedId, setSelectedId] = useState<string>("opt1");

  return (
    <div
      className="rounded-xl overflow-hidden bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <ArrowLeftRight size={15} style={{ color: C.blue }} />
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>
              Stock Transfer Options
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {options.length} transfer options · Select one to preview its impact on production and waste
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          LP Optimised
        </span>
      </div>

      {/* Option cards side by side */}
      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const saving = opt.businessWasteBefore - opt.businessWasteAfter;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedId(opt.id)}
              className="text-left rounded-xl overflow-hidden transition-all"
              style={{
                border: isSelected
                  ? `2px solid ${C.blue}`
                  : opt.isBest
                    ? `1.5px solid ${C.blue}`
                    : "1.5px solid #e2e8f0",
                boxShadow: isSelected
                  ? "0 4px 14px rgba(21,101,192,0.16)"
                  : opt.isBest
                    ? "0 2px 8px rgba(21,101,192,0.10)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                background: "white",
              }}
            >
              {/* Card header */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: isSelected || opt.isBest ? C.navy : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-bold text-sm"
                    style={{ color: isSelected || opt.isBest ? "#fff" : C.navy }}
                  >
                    {opt.routeFrom}
                    <span className="mx-1.5 opacity-70">→</span>
                    <span style={{ color: isSelected || opt.isBest ? "#93c5fd" : C.blue }}>
                      {opt.routeTo}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.isBest && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: C.green, color: "#fff" }}
                    >
                      <Star size={9} fill="currentColor" />
                      Best
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: isSelected || opt.isBest ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                      color: isSelected || opt.isBest ? "rgba(255,255,255,0.8)" : "#64748b",
                    }}
                  >
                    {opt.label}
                  </span>
                </div>
              </div>

              {/* Detail rows */}
              <div className="divide-y divide-[#f1f5f9]">
                {/* Business waste */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Business Waste
                  </span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "#dc2626" }}>
                    ₹{opt.businessWasteAfter.toLocaleString("en-IN")}
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums" style={{ color: C.green }}>
                      ↓ ₹{saving.toLocaleString("en-IN")}
                    </span>
                  </span>
                </div>

                {/* Material */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Material
                  </span>
                  {(() => {
                    const [type, ...rest] = opt.material.split(" ");
                    const badge = type === "RM" ? RM_BADGE : type === "PM" ? PM_BADGE : { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {type}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: C.navy }}>{rest.join(" ")}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Transfer quantity */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Transfer Quantity
                  </span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>
                    {opt.transferQty.toLocaleString("en-IN")} units
                  </span>
                </div>

                {/* Lane availability */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Lane Availability
                  </span>
                  {opt.laneAvailable === true ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.green }}>
                      <Check size={12} strokeWidth={2.5} />
                      Available
                    </span>
                  ) : opt.laneAvailable === false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#ea580c" }}>
                      <Link2Off size={11} />
                      Unavailable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#d97706" }}>
                      <Clock size={11} />
                      Not configured
                    </span>
                  )}
                </div>

                {/* Cost of transfer */}
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Cost of Transfer
                  </span>
                  <span className="text-xs font-medium" style={{ color: "#374151" }}>
                    ₹{opt.costPerTrip.toLocaleString("en-IN")}/trip
                  </span>
                </div>

                {/* Production stop date */}
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                    Production Stop Date
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>
                    {opt.prodStopDest}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected option action hint */}
      {selectedId && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
        >
          <p className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-semibold" style={{ color: C.navy }}>
              {options.find((o) => o.id === selectedId)?.label}
            </span>{" "}
            selected · Review the component breakdown below to confirm impact
          </p>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ backgroundColor: C.navy, color: "#fff" }}
          >
            Raise STO
          </button>
        </div>
      )}
    </div>
  );
}
