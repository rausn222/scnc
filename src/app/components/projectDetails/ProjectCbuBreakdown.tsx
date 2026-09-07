import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { useNav } from "../../App";
import {
  C,
  STATUS_STYLES,
  CBU_COLUMN_LABELS,
  DISCONTINUED_LABEL,
  NO_CBU_DATA_MESSAGE,
  SCENARIO_TONE_STYLE,
} from "../../constants/projectDetails";
import type { ProjectCbu } from "./types";
import { StageProgress } from "./StageProgress";
import { formatINR } from "./utils";

const CBU_GRID_COLS = "minmax(140px,1.3fr) minmax(140px,1.3fr) minmax(120px,1fr) 90px minmax(140px,1.2fr) 100px";

const SCENARIO_ICON = {
  positive: CheckCircle2,
  watch: Clock,
};

export function ProjectCbuBreakdown({ cbus }: Readonly<{ cbus: ProjectCbu[] }>) {
  const { navigate } = useNav();

  if (cbus.length === 0) {
    return (
      <div className="px-4 py-4 text-center text-xs" style={{ backgroundColor: "#fff", color: "#7192c4" }}>
        {NO_CBU_DATA_MESSAGE}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <div
        className="grid items-center px-4 py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: CBU_GRID_COLS, color: C.navy, borderTop: "1px solid #dbe6f6", borderBottom: "1px solid #dbe6f6" }}
      >
        <span>{CBU_COLUMN_LABELS.oldCbu}</span>
        <span>{CBU_COLUMN_LABELS.newCbu}</span>
        <span>{CBU_COLUMN_LABELS.stage}</span>
        <span>{CBU_COLUMN_LABELS.status}</span>
        <span>{CBU_COLUMN_LABELS.scenario}</span>
        <span className="text-right">{CBU_COLUMN_LABELS.valueAtRisk}</span>
      </div>

      {cbus.map((c) => {
        const statusStyle = STATUS_STYLES[c.status];
        const ScenarioIcon = c.scenarioTone ? SCENARIO_ICON[c.scenarioTone] : null;
        const scenarioColor = c.scenarioTone ? SCENARIO_TONE_STYLE[c.scenarioTone].color : undefined;

        return (
          <div
            key={c.id}
            className="grid items-center px-4 py-3"
            style={{ gridTemplateColumns: CBU_GRID_COLS, borderBottom: "1px solid #dbe6f6" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: C.navy }}>
                {c.oldCode}
              </p>
              <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
                {c.oldDescription}
              </p>
            </div>

            <div className="min-w-0">
              {c.newCode ? (
                <>
                  <p className="text-xs font-bold truncate" style={{ color: C.green }}>
                    {c.newCode}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "#64748b" }}>
                    {c.newDescription}
                  </p>
                </>
              ) : (
                <p className="text-xs font-bold italic" style={{ color: C.red }}>
                  {DISCONTINUED_LABEL}
                </p>
              )}
            </div>

            <StageProgress stage={c.stage} showLabel={false} />

            <div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
              >
                {c.status}
              </span>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              {c.scenario && ScenarioIcon ? (
                <>
                  <ScenarioIcon size={12} className="shrink-0" style={{ color: scenarioColor }} />
                  <span className="text-xs font-medium truncate" style={{ color: scenarioColor }}>
                    {c.scenario}
                  </span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate({ page: "network-down-stocking-agent", srNo: c.srNo })}
                  title="Run scenario simulations for this CBU in the Network Down Stocking Agent"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer"
                  style={{ backgroundColor: C.bgBlue, color: C.blue, border: `1px solid ${C.borderBlue}` }}
                >
                  <PlayCircle size={12} />
                  Simulate Scenarios
                </button>
              )}
            </div>

            <span
              className="text-xs font-bold text-right"
              style={{ color: c.status === "At Risk" ? C.red : C.navy }}
            >
              {formatINR(c.valueAtRisk)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
