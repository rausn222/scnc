import { useState } from "react";
import { Star } from "lucide-react";
import { C, MOQ_PLANT_OPTIONS, RM_BADGE, PM_BADGE } from "../constants";

export function MOQProcurementOptionsPanel() {
  const [selectedPlant, setSelectedPlant] = useState<string>("p_u535");
  const [suppliers, setSuppliers] = useState<Record<string, string>>(
    () => Object.fromEntries(MOQ_PLANT_OPTIONS.map((p) => [p.id, p.suppliers[0].id]))
  );

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
          <div>
            <p className="text-sm font-bold" style={{ color: C.navy }}>Procurement Options</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
              {MOQ_PLANT_OPTIONS.length} plant options · Select supplier to update procurement data
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

      {/* Plant option cards */}
      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${MOQ_PLANT_OPTIONS.length}, minmax(0, 1fr))` }}>
        {MOQ_PLANT_OPTIONS.map((plant) => {
          const isSelected = selectedPlant === plant.id;
          const selSup = plant.suppliers.find((s) => s.id === suppliers[plant.id]) ?? plant.suppliers[0];
          return (
            <button
              key={plant.id}
              type="button"
              onClick={() => setSelectedPlant(plant.id)}
              className="text-left rounded-xl overflow-hidden transition-all"
              style={{
                border: isSelected
                  ? `2px solid ${C.blue}`
                  : plant.isBest
                    ? `1.5px solid ${C.blue}`
                    : "1.5px solid #e2e8f0",
                boxShadow: isSelected
                  ? "0 4px 14px rgba(21,101,192,0.16)"
                  : plant.isBest
                    ? "0 2px 8px rgba(21,101,192,0.10)"
                    : "0 1px 3px rgba(0,0,0,0.04)",
                background: "white",
              }}
            >
              {/* Card header */}
              <div
                className="px-4 py-2.5"
                style={{
                  backgroundColor: isSelected || plant.isBest ? C.navy : "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: isSelected || plant.isBest ? "#fff" : C.navy }}>
                    {plant.plant}
                  </span>
                  {plant.isBest && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: C.green, color: "#fff" }}
                    >
                      <Star size={9} fill="currentColor" />Best
                    </span>
                  )}
                </div>
                {/* Supplier dropdown */}
                <select
                  value={suppliers[plant.id]}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSuppliers((prev) => ({ ...prev, [plant.id]: e.target.value }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[11px] rounded-lg px-2 py-1 cursor-pointer font-medium"
                  style={{
                    border: `1px solid ${isSelected || plant.isBest ? "rgba(255,255,255,0.3)" : "#cbd5e1"}`,
                    color: isSelected || plant.isBest ? C.navy : C.navy,
                    backgroundColor: isSelected || plant.isBest ? "rgba(255,255,255,0.92)" : "#fff",
                    outline: "none",
                  }}
                >
                  {plant.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Detail rows */}
              <div className="divide-y divide-[#f1f5f9]">
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Business Waste</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: "#dc2626" }}>
                    ₹{selSup.bizWaste.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Material</span>
                  {(() => {
                    const [type, ...rest] = plant.material.split(" ");
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
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Order Qty</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>
                    {plant.orderQty.toLocaleString("en-IN")} units
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>MOQ</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: C.navy }}>
                    {selSup.moq.toLocaleString("en-IN")} units
                  </span>
                </div>
                <div className="px-4 py-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Price / Unit</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "#374151" }}>₹{selSup.pricePerUnit}</span>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Production Date</span>
                  <span className="text-xs font-semibold" style={{ color: C.navy }}>{selSup.productionDate}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer action */}
      {selectedPlant && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}
        >
          <p className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-semibold" style={{ color: C.navy }}>
              {MOQ_PLANT_OPTIONS.find((p) => p.id === selectedPlant)?.plant}
            </span>{" "}
            selected ·{" "}
            <span className="font-semibold" style={{ color: C.navy }}>
              {(() => {
                const p = MOQ_PLANT_OPTIONS.find((pl) => pl.id === selectedPlant)!;
                const s = p.suppliers.find((s) => s.id === suppliers[selectedPlant]) ?? p.suppliers[0];
                return s.name;
              })()}
            </span>{" "}
            as supplier · Review breakdown below to confirm impact
          </p>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ backgroundColor: C.navy, color: "#fff" }}
          >
            Raise PO
          </button>
        </div>
      )}
    </div>
  );
}
