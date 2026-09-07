import type React from "react";
import { Info } from "lucide-react";
import { C } from "./constants";

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
        className="px-5 py-4 flex items-start gap-3"
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <span
          className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider text-white"
          style={{ backgroundColor: C.blue }}
        >
          STEP {step}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold tracking-wide uppercase flex items-center gap-1.5"
            style={{ color: C.navy }}
          >
            {title}
            {info && (
              <span title={info} style={{ cursor: "help", display: "inline-flex" }}>
                <Info size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
              </span>
            )}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
