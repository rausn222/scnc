import { useState } from "react";
import { ChevronDown, PackageCheck } from "lucide-react";
import { useNav } from "../../App";
import {
  C,
  STATUS_STYLES,
  LIST_COLUMN_LABELS,
  METRIC_LABELS,
} from "../../constants/projectDetails";
import type { Project } from "./types";
import { StageProgress } from "./StageProgress";
import { ProjectCbuBreakdown } from "./ProjectCbuBreakdown";
import { buildActionTasks } from "../actionDetails/ActionTaskList";
import { formatINR, projectToScenarioDetails } from "./utils";

const GRID_COLS = "minmax(220px,2.2fr) minmax(150px,1.3fr) 90px 64px 64px 96px 90px 28px 28px";

interface Props {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ProjectListTable({ projects, selectedId, onSelect }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { navigate } = useNav();

  function handleTrackProject(project: Project) {
    const scenario = projectToScenarioDetails(project);
    navigate({
      page: "tracking-details",
      tasks: buildActionTasks(scenario),
      scenario,
      project,
      from: { page: "project-details" },
    });
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div
        className="grid items-center px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
        style={{ gridTemplateColumns: GRID_COLS, backgroundColor: C.bgBlue, color: C.navy }}
      >
        <span>{LIST_COLUMN_LABELS.project}</span>
        <span>{LIST_COLUMN_LABELS.stageProgress}</span>
        <span>{LIST_COLUMN_LABELS.status}</span>
        <span className="text-center" style={{ gridColumn: "span 4 / span 4" }}>
          {LIST_COLUMN_LABELS.metrics}
        </span>
        <span />
        <span />
      </div>
      <div
        className="grid items-center px-3 pb-1.5 pt-0.5 text-[9px] font-semibold uppercase tracking-wide"
        style={{ gridTemplateColumns: GRID_COLS, backgroundColor: C.bgBlue, color: "#7192c4" }}
      >
        <span />
        <span />
        <span />
        <span className="text-right">{METRIC_LABELS.cbus}</span>
        <span className="text-right">{METRIC_LABELS.atRisk}</span>
        <span className="text-right">{METRIC_LABELS.valueAtRisk}</span>
        <span className="text-right">{METRIC_LABELS.targetEol}</span>
        <span />
        <span />
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-10 text-xs" style={{ color: "#94a3b8" }}>
          No projects match this filter.
        </div>
      ) : (
        projects.map((p) => {
          const isSelected = p.id === selectedId;
          const isExpanded = p.id === expandedId;
          const statusStyle = STATUS_STYLES[p.status];

          return (
            <div
              key={p.id}
              style={{
                borderTop: "1px solid #e2e8f0",
                position: "relative",
                outline: isSelected ? `3px solid ${C.blue}` : undefined,
                outlineOffset: isSelected ? -2 : undefined,
                zIndex: isSelected ? 1 : undefined,
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(p.id);
                }}
                className="grid items-center w-full text-left px-3 py-3 transition-colors cursor-pointer"
                style={{
                  gridTemplateColumns: GRID_COLS,
                  backgroundColor: isSelected ? C.selectedBlue : "#fff",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
                }}
              >
                <div className="min-w-0 pr-2">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {p.code}
                  </span>
                  <div className="text-xs font-bold mt-1 truncate" style={{ color: C.navy }}>
                    {p.name}
                  </div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>
                    {p.category}
                  </div>
                </div>

                <StageProgress stage={p.stage} />

                <div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
                  >
                    {p.status}
                  </span>
                </div>

                <span className="text-xs font-semibold text-right" style={{ color: "#374151" }}>
                  {p.metrics.cbus}
                </span>
                <span
                  className="text-xs font-semibold text-right"
                  style={{ color: p.metrics.atRisk > 0 ? C.red : "#cbd5e1" }}
                >
                  {p.metrics.atRisk}
                </span>
                <span
                  className="text-xs font-bold text-right"
                  style={{ color: p.status === "At Risk" ? C.red : C.navy }}
                >
                  {formatINR(p.metrics.valueAtRisk)}
                </span>
                <span className="text-[11px] text-right" style={{ color: "#64748b" }}>
                  {p.targetEol}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackProject(p);
                  }}
                  title={`View tracking details for ${p.name}`}
                  aria-label={`View tracking details for ${p.name}`}
                  className="p-1 rounded hover:bg-gray-100 justify-self-end cursor-pointer"
                >
                  <PackageCheck size={14} style={{ color: C.blue }} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : p.id);
                  }}
                  aria-label={isExpanded ? `Collapse ${p.name}` : `Expand ${p.name}`}
                  aria-expanded={isExpanded}
                  className="p-1 rounded hover:bg-gray-100 justify-self-end transition-transform cursor-pointer"
                  style={{ transform: isExpanded ? "rotate(180deg)" : undefined }}
                >
                  <ChevronDown size={14} style={{ color: "#94a3b8" }} />
                </button>
              </div>

              {isExpanded && <ProjectCbuBreakdown cbus={p.cbus} />}
            </div>
          );
        })
      )}
    </div>
  );
}
