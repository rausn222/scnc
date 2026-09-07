import { useEffect, useMemo, useState } from "react";
import type { OpenPoAssumptionLine } from "../types";
import { C } from "../constants";
import { DateWeekEditor } from "./DateWeekEditor";

export function OpenPoAssumptionsPanel({ lines }: { lines: OpenPoAssumptionLine[] }) {
  const lineKey = useMemo(() => lines.map((l) => l.id).join("|"), [lines]);
  const [lineDates, setLineDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setLineDates(Object.fromEntries(lines.map((l) => [l.id, l.date])));
  }, [lineKey, lines]);

  return (
    <div style={{ borderTop: "1px solid #f1f5f9" }}>
      <div className="px-4 py-4">
        <p className="text-xs font-semibold mb-2" style={{ color: C.navy }}>
          Open PO
        </p>
        <div
          className="overflow-x-auto rounded-lg"
          style={{ border: "1px solid #e2e8f0" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {[
                  "Plant code",
                  "Plant name",
                  "Component code",
                  "Desc",
                  "Date · Week",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center italic"
                    style={{ color: "#94a3b8" }}
                  >
                    No open POs for this CBU
                  </td>
                </tr>
              ) : (
                lines.map((line) => {
                  const date = lineDates[line.id] ?? line.date;
                  return (
                    <tr key={line.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.blue }}>
                        {line.plantCode}
                      </td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: C.navy }}>
                        {line.plantName}
                      </td>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.navy }}>
                        {line.componentCode}
                      </td>
                      <td
                        className="px-3 py-2.5 max-w-[200px] truncate"
                        style={{ color: "#64748b" }}
                        title={line.description}
                      >
                        {line.description}
                      </td>
                      <td className="px-3 py-2.5">
                        <DateWeekEditor
                          date={date}
                          onChange={(d) =>
                            setLineDates((prev) => ({ ...prev, [line.id]: d }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
