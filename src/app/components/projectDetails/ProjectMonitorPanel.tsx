import { Activity, AlertTriangle, CheckCircle2, Clock, Info, RefreshCw, X, Zap } from "lucide-react";
import {
  C,
  MONITOR_PANEL_TITLE,
  MONITOR_DIAGNOSIS_TITLE,
  MONITOR_BUSINESS_IMPACT_TITLE,
  MONITOR_SIGNALS_TITLE,
  MONITOR_RESIMULATE_LABEL,
  MONITOR_ON_TRACK_HEADLINE,
  SIGNAL_TONE_DOT,
} from "../../constants/projectDetails";
import type { Project } from "./types";

interface Props {
  project: Project;
  onResimulate?: (projectId: string) => void;
  alwaysShowResimulate?: boolean;
  /** Renders a close (X) button in the header — pass when shown as a full-screen overlay rather than a persistent sidebar panel. */
  onClose?: () => void;
}

export function ProjectMonitorPanel({ project, onResimulate, alwaysShowResimulate, onClose }: Props) {
  const m = project.monitor;
  const isDegraded = m.degradedPercent != null;

  return (
    <div
      className="rounded-xl bg-white overflow-hidden flex flex-col"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,48,135,0.06)" }}
    >
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <Zap size={14} style={{ color: C.blue }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: C.navy }}>
          {MONITOR_PANEL_TITLE}
        </span>
        <span className="w-1.5 h-1.5 rounded-full ml-auto" style={{ backgroundColor: C.green }} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close Scenario Monitor"
            className="p-0.5 rounded hover:bg-gray-100 cursor-pointer"
          >
            <X size={14} style={{ color: "#94a3b8" }} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-sm font-bold" style={{ color: C.navy }}>
            {project.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>
            {project.code}
          </p>
        </div>

        {isDegraded ? (
          <div
            className="rounded-lg p-4 flex items-center gap-4"
            style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <GaugeRing percent={m.degradedPercent as number} />
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: "#92400e" }}>
                {m.headline}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#a16207" }}>
                {m.headlineDetail}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg p-4 flex items-center gap-3"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <CheckCircle2 size={22} style={{ color: C.green }} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: "#166534" }}>
                {m.headline || MONITOR_ON_TRACK_HEADLINE}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#15803d" }}>
                {m.headlineDetail}
              </p>
            </div>
          </div>
        )}

        {(m.primaryDeviation || m.monitoringRule || m.decisionWindow) && (
          <div>
            <SectionLabel>{MONITOR_DIAGNOSIS_TITLE}</SectionLabel>
            <div className="space-y-2">
              {m.primaryDeviation && (
                <DiagnosisCard
                  icon={<AlertTriangle size={13} style={{ color: C.red }} />}
                  bg="#fef2f2"
                  border="#fecaca"
                  titleColor="#991b1b"
                  detailColor="#b91c1c"
                  title={m.primaryDeviation.title}
                  detail={m.primaryDeviation.detail}
                />
              )}
              {m.monitoringRule && (
                <DiagnosisCard
                  icon={<Info size={13} style={{ color: C.blue }} />}
                  bg={C.bgBlue}
                  border={C.borderBlue}
                  titleColor={C.navy}
                  detailColor="#3b6bb0"
                  title={m.monitoringRule.title}
                  detail={m.monitoringRule.detail}
                />
              )}
              {m.decisionWindow && (
                <DiagnosisCard
                  icon={<Clock size={13} style={{ color: "#b45309" }} />}
                  bg="#fffbeb"
                  border="#fde68a"
                  titleColor="#92400e"
                  detailColor="#a16207"
                  title={`Decision window: ${m.decisionWindow.days}-day planner intervention`}
                  detail={m.decisionWindow.detail}
                />
              )}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>{MONITOR_BUSINESS_IMPACT_TITLE}</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <ImpactStat label="Expected benefit" value={m.businessImpact.expectedBenefit} />
            <ImpactStat
              label="Current projection"
              value={m.businessImpact.currentProjection}
              valueColor={isDegraded ? C.red : C.navy}
            />
            <ImpactStat label="PO FG Equiv" value={m.businessImpact.poFgEquiv} />
            <ImpactStat
              label="New shortfall"
              value={m.businessImpact.newShortfall}
              valueColor={isDegraded ? C.red : C.navy}
            />
          </div>
        </div>

        {m.signals.length > 0 && (
          <div>
            <SectionLabel>{MONITOR_SIGNALS_TITLE}</SectionLabel>
            <div className="space-y-2.5">
              {m.signals.map((s) => (
                <div key={s.id} className="flex items-start gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: SIGNAL_TONE_DOT[s.tone] }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: "#1e293b" }}>
                      {s.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                      {s.detail}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
                      {s.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(alwaysShowResimulate || !(project.status === "Active" && !isDegraded)) && (
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={() => onResimulate?.(project.id)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
            style={{ backgroundColor: C.navy }}
          >
            <RefreshCw size={13} />
            {MONITOR_RESIMULATE_LABEL}
          </button>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
      <Activity size={11} style={{ color: "#94a3b8" }} />
      {children}
    </p>
  );
}

function DiagnosisCard({
  icon,
  bg,
  border,
  titleColor,
  detailColor,
  title,
  detail,
}: {
  icon: React.ReactNode;
  bg: string;
  border: string;
  titleColor: string;
  detailColor: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold" style={{ color: titleColor }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: detailColor }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

function ImpactStat({ label, value, valueColor = C.navy }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
      <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
        {label}
      </p>
      <p className="text-xs font-bold mt-0.5 truncate" style={{ color: valueColor }}>
        {value}
      </p>
    </div>
  );
}

function GaugeRing({ percent }: { percent: number }) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);
  const color = percent < 50 ? C.red : percent < 85 ? "#d97706" : C.green;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fde68a" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {percent}%
      </div>
    </div>
  );
}
