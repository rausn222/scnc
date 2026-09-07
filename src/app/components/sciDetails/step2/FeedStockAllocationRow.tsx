import { Send, Check } from "lucide-react";
import { toast } from "sonner";
import type { MoqBreakMaterial, FeedStockStatus } from "../types";
import { C } from "../constants";
import { FEED_STOCK_STATUS_META } from "../utils";

export function FeedStockAllocationRow({
  mat,
  value,
  conv,
  status,
  selectedCbu,
  onChange,
  onConvChange,
  onSelectCbu,
}: {
  mat: MoqBreakMaterial;
  value: string;
  conv: string;
  status: FeedStockStatus;
  selectedCbu?: string;
  onChange: (next: string) => void;
  onConvChange: (next: string) => void;
  onSelectCbu?: (cbu: string) => void;
}) {
  const statusMeta = FEED_STOCK_STATUS_META[status];
  const isShared = status === "shared";
  const isNeeded = status === "needed";

  return (
    <div
      className="px-4 py-2.5"
      style={{
        borderTop: "1px solid #f8fafc",
        backgroundColor: isShared ? "#eff6ff" : undefined,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
          style={{ backgroundColor: mat.badgeBg, color: mat.badgeColor }}
        >
          {mat.type}
        </span>
        <span className="text-sm font-medium" style={{ color: C.navy }}>
          {mat.code}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="Enter the feed stock name or ID"
          placeholder="Feed stock name / ID"
          className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
          style={{ border: "1px solid #d1d5db", minWidth: 200, color: "#111827" }}
        />
        <input
          type="text"
          value={conv}
          onChange={(e) => onConvChange(e.target.value)}
          title="Enter the conversion factor for this feed stock"
          placeholder="Conv."
          className="px-3 py-1.5 rounded-lg text-xs text-center focus:outline-none"
          style={{ border: "1px solid #d1d5db", width: 68, color: "#111827" }}
        />
        <span
          className="px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap text-center"
          style={{ backgroundColor: statusMeta.bg, color: statusMeta.color, minWidth: 92 }}
        >
          {statusMeta.label}
        </span>
      </div>
      </div>

      {isNeeded && (
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-xs" style={{ color: "#b45309" }}>
            Feed stock not available? Request it from the supplier.
          </span>
          <button
            type="button"
            onClick={() =>
              toast.success(`Feed stock request sent to supplier for ${mat.code}`)
            }
            title={`Send a feed stock data request to the supplier for ${mat.code}`}
            className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: "#b45309" }}
          >
            <Send size={12} />
            Request from supplier
          </button>
        </div>
      )}

      {isShared && (
        <div className="mt-2.5">
          <p className="text-xs" style={{ color: "#1d4ed8" }}>
            Feed stock <span className="font-bold">{value}</span> is available, but it
            feeds multiple CBUs. Select which CBU to continue producing with, then send
            that choice to the supplier.
          </p>
          <p
            className="uppercase mt-2.5 mb-1.5"
            style={{
              color: "#1d4ed8",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            Continue with CBU
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {mat.sharedCbus?.map((cbu) => {
              const isSelected = cbu === selectedCbu;
              return (
                <button
                  key={cbu}
                  type="button"
                  onClick={() => onSelectCbu?.(cbu)}
                  title={isSelected ? `Continuing production with ${cbu}` : `Continue production with ${cbu}`}
                  className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={
                    isSelected
                      ? { backgroundColor: C.navy, color: "#ffffff" }
                      : {
                          backgroundColor: "#ffffff",
                          color: C.navy,
                          border: "1px solid #93c5fd",
                        }
                  }
                >
                  {isSelected && <Check size={12} />}
                  {cbu}
                  {isSelected ? " (this CBU)" : ""}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() =>
              toast.success(
                `Sent CBU choice (${selectedCbu ?? "—"}) to supplier for ${mat.code}`,
              )
            }
            title={`Send the selected CBU choice to the supplier for ${mat.code}`}
            className="flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white mt-2.5"
            style={{ backgroundColor: C.blue }}
          >
            <Send size={12} />
            Send to supplier
          </button>
        </div>
      )}
    </div>
  );
}
