import type { ReactNode } from "react";
import { PanelRightClose, Sparkles } from "lucide-react";

const BORDER = "#e2e8f0";
const NAVY = "#003087";

export type ExplainabilityTone = "critical" | "warning" | "positive" | "neutral";

export interface ExplainabilitySection {
  id: string;
  label: string;
  tone: ExplainabilityTone;
  bullets: string[];
}

/** Data contract for the panel — a page computes this from whatever it's
 * currently showing (all rows, a filtered set, a single selected item) and
 * hands it to the panel to render. The panel itself has no domain knowledge. */
export interface ExplainabilityContent {
  subjectLabel: string;
  subjectSub?: string;
  /** The 2-3 line plain-language summary shown above the section breakdown. */
  summary: string;
  sections: ExplainabilitySection[];
}

const TONE_STYLES: Record<ExplainabilityTone, { bg: string; text: string; dot: string }> = {
  critical: { bg: "#fef2f2", text: "#b91c1c", dot: "#dc2626" },
  warning: { bg: "#fff7ed", text: "#b45309", dot: "#f59e0b" },
  positive: { bg: "#f0fdf4", text: "#15803d", dot: "#16a34a" },
  neutral: { bg: "#eff6ff", text: "#1565C0", dot: "#1565C0" },
};

export interface ExplainabilityPanelProps {
  content: ExplainabilityContent;
  title?: string;
  icon?: ReactNode;
  /** Renders a collapse (panel-close) button in the header — pass when the host page can hide the panel to give the rest of the layout full width. */
  onClose?: () => void;
}

/** Generic "explain what I'm looking at" side panel. Renders a headline
 * summary plus a set of tone-colored sections — content is fully driven by
 * `content`, so the same component works for any page/dataset that can
 * describe itself as an `ExplainabilityContent`. */
export function ExplainabilityPanel({
  content,
  title = "Explainability",
  icon,
  onClose,
}: Readonly<ExplainabilityPanelProps>) {
  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden h-full"
      style={{
        backgroundColor: "#ffffff",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
      }}
    >
      <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(21,101,192,0.1)", color: "#1565C0" }}
        >
          {icon ?? <Sparkles size={14} />}
        </div>
        <span className="text-xs font-bold uppercase tracking-wide flex-1 min-w-0 truncate" style={{ color: NAVY }}>
          {title}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Hide panel"
            aria-label="Hide panel"
            className="flex items-center justify-center w-6 h-6 rounded-md transition-colors cursor-pointer shrink-0"
            style={{ color: "#6b7280" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <PanelRightClose size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: "#6b7280" }}>
            {content.subjectLabel}
          </div>
          {content.subjectSub && (
            <div className="text-xs mt-0.5 truncate" style={{ color: "#9ca3af" }}>
              {content.subjectSub}
            </div>
          )}
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "#111827" }}>
            {content.summary}
          </p>
        </div>

        {content.sections.map((section) => {
          const tone = TONE_STYLES[section.tone];
          return (
            <div key={section.id} className="rounded-lg px-3 py-2.5" style={{ backgroundColor: tone.bg }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tone.dot }} />
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tone.text }}>
                  {section.label}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {section.bullets.map((bullet, i) => (
                  <li key={i} className="text-[11px] leading-snug" style={{ color: "#374151" }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
