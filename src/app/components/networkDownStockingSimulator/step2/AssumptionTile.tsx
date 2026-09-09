import type React from "react";
import { ChevronRight } from "lucide-react";
import { C } from "../../sciDetails/constants";

/**
 * Clickable summary card for a Step 2 assumption. Everything sits on one
 * compact horizontal band (icon, title+subtitle, status, chevron) so the
 * tile height stays tight — the full editor lives in the modal on click.
 */
export function AssumptionTile({
  icon,
  title,
  titleBadge,
  subtitle,
  summary,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  titleBadge?: React.ReactNode;
  subtitle: string;
  summary?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Open ${title} settings`}
      className="w-full h-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left transition-all cursor-pointer"
      style={{ border: `1px solid ${C.border}`, backgroundColor: C.white }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.borderBlue;
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(21,101,192,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = C.border;
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: C.bgBlue }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="min-w-0 text-xs font-bold truncate"
            style={{ color: C.navy }}
            title={title}
          >
            {title}
          </p>
          {titleBadge}
        </div>
        <p className="text-[11px] truncate" style={{ color: C.muted }} title={subtitle}>
          {subtitle}
        </p>
      </div>
      {summary && <div className="shrink-0">{summary}</div>}
      <ChevronRight size={14} style={{ color: C.borderMuted, flexShrink: 0 }} />
    </button>
  );
}
