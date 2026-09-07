import { Package, ChevronDown, ChevronRight } from "lucide-react";
import {
  UOM_OPTIONS,
  STOCK_TABLE_HEADER_LABELS,
  stockTableSectionTitle,
  formatUomLabel,
  CLUSTER_DRILLDOWN_HINT,
  onHandToggleTitle,
} from "../../constants/cbuDetail";
import { CbuColumnCustomizer } from "./CbuColumnCustomizer";
import type { UomFilter } from "./types";

interface Props {
  isPlantView: boolean;
  anyOnHandExpanded: boolean;
  onToggleOnHand: () => void;
  uom: UomFilter;
  onUomChange: (id: UomFilter) => void;
  hiddenCols: Set<string>;
  onHiddenColsChange: (next: string[]) => void;
}

export function StockTableHeader({
  isPlantView,
  anyOnHandExpanded,
  onToggleOnHand,
  uom,
  onUomChange,
  hiddenCols,
  onHiddenColsChange,
}: Readonly<Props>) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Package size={15} style={{ color: "#1565C0" }} />
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#1565C0" }}
          >
            {stockTableSectionTitle(isPlantView)}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
          {formatUomLabel(uom)}
          {!isPlantView && CLUSTER_DRILLDOWN_HINT}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>
            {STOCK_TABLE_HEADER_LABELS.onHandStock}
          </span>
          <button
            type="button"
            onClick={onToggleOnHand}
            title={onHandToggleTitle(anyOnHandExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
            style={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: anyOnHandExpanded ? "#93c5fd" : "#d1d5db",
              backgroundColor: anyOnHandExpanded ? "#eff6ff" : "#ffffff",
              color: anyOnHandExpanded ? "#1e40af" : "#374151",
            }}
          >
            {anyOnHandExpanded
              ? STOCK_TABLE_HEADER_LABELS.collapse
              : STOCK_TABLE_HEADER_LABELS.expandBreakdown}
            {anyOnHandExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>
            {STOCK_TABLE_HEADER_LABELS.uom}
          </span>
          <div
            className="flex rounded-full overflow-hidden text-xs"
            style={{ borderWidth: 1, borderStyle: "solid", borderColor: "#d1d5db" }}
          >
            {UOM_OPTIONS.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => onUomChange(id)}
                title={description}
                className="px-4 py-1.5 cursor-pointer transition-colors font-medium"
                style={{
                  backgroundColor: uom === id ? "#1565C0" : "#ffffff",
                  color: uom === id ? "#ffffff" : "#374151",
                  fontSize: 12,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <CbuColumnCustomizer
          hiddenCols={hiddenCols}
          onChange={onHiddenColsChange}
        />
      </div>
    </div>
  );
}
