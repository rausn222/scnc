import { AlertTriangle } from "lucide-react";
import { TableSkeleton } from "../TableSkeleton";
import { LOADING_TEXT, ERROR_TEXT, ERROR_BACK_LABEL } from "../../constants/cbuDetail";

const KPI_CARD_COUNT = 7;

export function CbuDetailLoading() {
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#f5f7fa" }}
      aria-busy="true"
      aria-label={LOADING_TEXT}
    >
      <div
        className="h-16 shrink-0"
        style={{ background: "linear-gradient(135deg, #003087 0%, #1565C0 100%)" }}
      />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          {Array.from({ length: KPI_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-white h-[84px] animate-pulse"
              style={{ border: "1px solid #e2e8f0" }}
            />
          ))}
        </div>
        <div
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <TableSkeleton columns={8} rows={6} />
        </div>
      </div>
    </div>
  );
}

export function CbuDetailError({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex flex-col h-full items-center justify-center gap-2"
      style={{ backgroundColor: "#f5f7fa" }}
    >
      <AlertTriangle size={24} style={{ color: "#dc2626" }} />
      <p className="text-sm" style={{ color: "#64748b" }}>{ERROR_TEXT}</p>
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold cursor-pointer"
        style={{ color: "#1565C0" }}
      >
        {ERROR_BACK_LABEL}
      </button>
    </div>
  );
}
