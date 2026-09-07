import { FlaskConical, Info } from "lucide-react";
import { TABLE_HINTS, QUICK_TIPS_LABEL } from "../../constants/nationalDashboard";
import type { TableHint } from "./types";

const HINT_ICONS: Record<string, TableHint["icon"]> = {
  "Flask icon": FlaskConical,
};

export function TableHintsBar() {
  const hints: TableHint[] = TABLE_HINTS.map((hint) => ({
    ...hint,
    icon: HINT_ICONS[hint.target],
  }));

  return (
    <div
      className="shrink-0 px-5 py-2.5 border-b"
      style={{
        background:
          "linear-gradient(90deg, rgba(21,101,192,0.06) 0%, rgba(21,101,192,0.02) 100%)",
        borderColor: "rgba(21, 101, 192, 0.12)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          className="inline-flex items-center gap-2 shrink-0 pr-4"
          style={{ borderRight: "1px solid rgba(21, 101, 192, 0.15)" }}
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md"
            style={{ backgroundColor: "rgba(21, 101, 192, 0.1)" }}
          >
            <Info size={13} style={{ color: "#1565C0" }} aria-hidden="true" />
          </span>
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{
              color: "#003087",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {QUICK_TIPS_LABEL}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 flex-1 min-w-0">
          {hints.map((hint, index) => {
            const Icon = hint.icon;
            return (
              <div
                key={hint.target}
                className="inline-flex items-center gap-2.5 shrink-0"
                style={
                  index < hints.length - 1
                    ? { borderRight: "1px solid rgba(21, 101, 192, 0.14)", paddingRight: 20 }
                    : undefined
                }
              >
                {Icon ? (
                  <Icon size={13} style={{ color: hint.iconColor || "#1565C0" }} />
                ) : (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: "rgba(21, 101, 192, 0.35)" }}
                  />
                )}
                <span className="text-[11px] whitespace-nowrap">
                  <span className="font-bold" style={{ color: "#003087" }}>
                    {hint.target}
                  </span>
                  <span className="font-medium" style={{ color: "#7c93b8" }}>
                    {" "}
                    - {" "}
                  </span>
                  <span className="font-medium" style={{ color: "#475569" }}>
                    {hint.action}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
