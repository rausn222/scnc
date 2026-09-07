import { confidenceMeta } from "./utils";

export function ConfidenceScoreBar({ score, hideCaption = false }: { score: number; hideCaption?: boolean }) {
  const { color, label } = confidenceMeta(score);
  return (
    <div className="text-right shrink-0 min-w-[128px]">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {score}%
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#e2e8f0" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      {!hideCaption && (
        <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
          Break confidence
        </p>
      )}
    </div>
  );
}
