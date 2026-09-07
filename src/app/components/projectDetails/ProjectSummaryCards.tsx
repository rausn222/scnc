import { FolderKanban, Layers, AlertTriangle, IndianRupee } from "lucide-react";
import { C, SUMMARY_CARD_LABELS } from "../../constants/projectDetails";
import { formatINR } from "./utils";

interface Props {
  totalProjects: number;
  atRiskProjectCount: number;
  totalCbus: number;
  acceptedCbus: number;
  atRiskCbus: number;
  valueAtRisk: number;
}

export function ProjectSummaryCards({
  totalProjects,
  atRiskProjectCount,
  totalCbus,
  acceptedCbus,
  atRiskCbus,
  valueAtRisk,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard
        icon={<FolderKanban size={16} />}
        iconBg={C.bgBlue}
        iconColor={C.blue}
        label={SUMMARY_CARD_LABELS.totalProjects}
        value={String(totalProjects)}
        sub={`${atRiskProjectCount} at risk`}
        subColor={atRiskProjectCount > 0 ? C.red : "#94a3b8"}
      />
      <SummaryCard
        icon={<Layers size={16} />}
        iconBg={C.bgBlue}
        iconColor={C.blue}
        label={SUMMARY_CARD_LABELS.totalCbus}
        value={String(totalCbus)}
        sub={`${acceptedCbus} with accepted scenario`}
        subColor="#94a3b8"
      />
      <SummaryCard
        icon={<AlertTriangle size={16} />}
        iconBg={atRiskCbus > 0 ? "#fee2e2" : C.bgBlue}
        iconColor={atRiskCbus > 0 ? C.red : C.blue}
        label={SUMMARY_CARD_LABELS.atRisk}
        value={String(atRiskProjectCount)}
        valueColor={atRiskProjectCount > 0 ? C.red : C.navy}
        sub="Require immediate action"
        subColor="#94a3b8"
      />
      <SummaryCard
        icon={<IndianRupee size={16} />}
        iconBg={valueAtRisk > 0 ? "#fee2e2" : C.bgBlue}
        iconColor={valueAtRisk > 0 ? C.red : C.blue}
        label={SUMMARY_CARD_LABELS.valueAtRisk}
        value={formatINR(valueAtRisk)}
        valueColor={valueAtRisk > 0 ? C.red : C.navy}
        sub="Across open scenarios"
        subColor="#94a3b8"
      />
    </div>
  );
}

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = C.navy,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  sub: string;
  subColor: string;
}) {
  return (
    <div
      className="rounded-xl p-4 bg-white flex items-start gap-3"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-bold uppercase tracking-wide mb-0.5" style={{ color: "#94a3b8", fontSize: 9 }}>
          {label}
        </p>
        <p className="font-bold truncate" style={{ color: valueColor, fontSize: 18 }}>
          {value}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: subColor }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
