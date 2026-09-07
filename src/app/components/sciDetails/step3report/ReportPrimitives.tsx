import type React from "react";
import { C } from "../constants";

/** Section heading used inside an option report card — reads like a document heading, not a table header. */
export function ReportSectionHeading({
  icon,
  title,
  subtitle,
  tint = "#f8fafc",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tint?: string;
}) {
  return (
    <div
      className="px-3 py-1.5 flex items-center gap-1.5 flex-wrap"
      style={{ backgroundColor: tint, borderBottom: "1px solid #e2e8f0", borderTop: "1px solid #e2e8f0" }}
    >
      <span
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#fff", color: C.blue, border: "1px solid #e2e8f0" }}
      >
        {icon}
      </span>
      <span className="text-xs font-bold" style={{ color: C.navy }}>
        {title}
      </span>
      {subtitle && (
        <span className="text-[10px]" style={{ color: "#64748b" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

/** A single readable "label above value" cell, laid out in a responsive grid by the caller. */
export function LabelValue({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
        {label}
      </span>
      <div className="text-[13px] leading-snug" style={{ color: "#1e293b" }}>
        {children}
      </div>
    </div>
  );
}

export function ReportBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, { bg: string; color: string; border: string }> = {
    neutral: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
    success: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
    warning: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
    danger: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
    info: { bg: C.bgBlue, color: C.blue, border: C.borderBlue },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ backgroundColor: t.bg, color: t.color, border: `1px solid ${t.border}` }}
    >
      {children}
    </span>
  );
}
