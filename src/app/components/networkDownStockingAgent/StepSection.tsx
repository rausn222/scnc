import type React from "react";
import { Info } from "lucide-react";
import { C } from "../sciDetails/constants";

/**
 * Compact step-card wrapper for the Network Down Stocking Agent page.
 * Trims the header/body padding used by sciDetails' StepSection so dense
 * steps (e.g. a row of dropdowns) don't carry large amounts of empty space.
 */
export function StepSection({
  step,
  title,
  subtitle,
  info,
  headerRight,
  children,
  overflowVisible = false,
}: {
  step: number;
  title: string;
  subtitle?: string;
  /** Longer explanation shown as a hover tooltip on an info icon, instead of always-visible text. */
  info?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  overflowVisible?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white ${overflowVisible ? "overflow-visible" : "overflow-hidden"}`}
      style={{
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,48,135,0.06)",
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <span
          className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider text-white"
          style={{ backgroundColor: C.blue }}
        >
          STEP {step}
        </span>
        <div className="min-w-0 flex-1 flex items-baseline gap-2 flex-wrap">
          <p
            className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 shrink-0"
            style={{ color: C.navy }}
          >
            {title}
            {info && (
              <span title={info} style={{ cursor: "help", display: "inline-flex" }}>
                <Info size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
              </span>
            )}
          </p>
          {subtitle && (
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
