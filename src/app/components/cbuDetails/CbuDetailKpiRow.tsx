import { TrendingUp, Package, Boxes, Calendar, BarChart2, Flame } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { fmt } from "./format";
import { monthLabel } from "./utils";
import { KPI_LABELS } from "../../constants/cbuDetail";
import type { AggregatedComponent } from "../data";

interface Props {
  uniqueRM: number;
  uniquePM: number;
  demand12: number;
  fgTotal: number;
  peakMonth: string | null;
  peakPlant: string;
  highContribComps: AggregatedComponent[];
}

function formatHighContribSub(comps: AggregatedComponent[]): string {
  if (comps.length === 0) return KPI_LABELS.highContributing.subFallback;
  return comps
    .map((c) => {
      const type = c.componentMaterialType === "1002" ? "RM" : "PM";
      return c.contributionPct != null
        ? `${c.componentCode} (${type}, ${c.contributionPct}%)`
        : `${c.componentCode} (${type})`;
    })
    .join(", ");
}

export function CbuDetailKpiRow({
  uniqueRM,
  uniquePM,
  demand12,
  fgTotal,
  peakMonth,
  peakPlant,
  highContribComps,
}: Readonly<Props>) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
      <KpiCard
        icon={<Package size={16} style={{ color: "#1565C0" }} />}
        label={KPI_LABELS.uniqueRm.label}
        value={String(uniqueRM || "—")}
        sub={KPI_LABELS.uniqueRm.sub}
        iconBg="#dbeafe"
        valueColor="#003087"
      />
      <KpiCard
        icon={<Package size={16} style={{ color: "#003087" }} />}
        label={KPI_LABELS.uniquePm.label}
        value={String(uniquePM || "—")}
        sub={KPI_LABELS.uniquePm.sub}
        iconBg="#dbeafe"
        valueColor="#003087"
      />
      <KpiCard
        icon={<Flame size={16} style={{ color: "#ea580c" }} />}
        label={KPI_LABELS.highContributing.label}
        value={String(highContribComps.length || "—")}
        sub={formatHighContribSub(highContribComps)}
        iconBg="#fff7ed"
        valueColor="#7c2d12"
      />
      <KpiCard
        icon={<TrendingUp size={16} style={{ color: "#1565C0" }} />}
        label={KPI_LABELS.demand12.label}
        value={fmt(demand12)}
        sub={KPI_LABELS.demand12.sub}
        iconBg="#dbeafe"
        valueColor="#003087"
      />
      <KpiCard
        icon={<Calendar size={16} style={{ color: "#16a34a" }} />}
        label={KPI_LABELS.peakMonth.label}
        value={peakMonth ? monthLabel(peakMonth) : "—"}
        sub={KPI_LABELS.peakMonth.sub}
        iconBg="#f0fdf4"
        valueColor="#14532d"
      />
      <KpiCard
        icon={<BarChart2 size={16} style={{ color: "#d97706" }} />}
        label={KPI_LABELS.peakPlant.label}
        value={peakPlant}
        sub={KPI_LABELS.peakPlant.sub}
        iconBg="#fffbeb"
        valueColor="#78350f"
      />
      <KpiCard
        icon={<Boxes size={16} style={{ color: "#1565C0" }} />}
        label={KPI_LABELS.fgStock.label}
        value={fmt(fgTotal)}
        sub={KPI_LABELS.fgStock.sub}
        iconBg="#dbeafe"
        valueColor="#003087"
      />
    </div>
  );
}
