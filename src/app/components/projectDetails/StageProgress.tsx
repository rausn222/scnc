import { Fragment } from "react";
import { C } from "../../constants/projectDetails";
import { PROJECT_STAGES } from "./types";
import type { ProjectStage } from "./types";

function stageTooltip(s: ProjectStage, i: number, currentIndex: number): string {
  const state = i < currentIndex ? "Completed" : i === currentIndex ? "Current stage" : "Upcoming";
  return `${s} — ${state}`;
}

export function StageProgress({ stage, showLabel = true }: { stage: ProjectStage; showLabel?: boolean }) {
  const currentIndex = PROJECT_STAGES.indexOf(stage);

  return (
    <div className="flex items-center gap-2 min-w-0" title={`Current stage: ${stage}`}>
      <div className="flex items-center shrink-0">
        {PROJECT_STAGES.map((s, i) => (
          <Fragment key={s}>
            {i > 0 && (
              <div
                className="h-px w-3"
                style={{ backgroundColor: i <= currentIndex ? C.navy : "#e2e8f0" }}
              />
            )}
            <div
              className="rounded-full shrink-0"
              title={stageTooltip(s, i, currentIndex)}
              style={{
                width: i === currentIndex ? 8 : 6,
                height: i === currentIndex ? 8 : 6,
                backgroundColor: i < currentIndex ? C.navy : i === currentIndex ? C.blue : "#e2e8f0",
                boxShadow: i === currentIndex ? `0 0 0 3px ${C.bgBlue}` : undefined,
              }}
            />
          </Fragment>
        ))}
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium truncate" style={{ color: "#64748b" }}>
          {stage}
        </span>
      )}
    </div>
  );
}
