import { C, PO_WEEK_OPTIONS } from "../constants";
import { MonthYearInput } from "./MonthYearInput";

export function OpenPoWeekMonthEditor({
  week,
  month,
  onWeekChange,
  onMonthChange,
}: {
  week: string;
  month: string;
  onWeekChange: (week: string) => void;
  onMonthChange: (month: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MonthYearInput value={month} onChange={onMonthChange} />
      <label className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium shrink-0" style={{ color: "#64748b" }}>
          Wk
        </span>
        <select
          value={week}
          onChange={(e) => onWeekChange(e.target.value)}
          title="Select the week of the month"
          className="text-xs px-2 py-1 rounded-lg cursor-pointer"
          style={{ border: "1px solid #d1d5db", color: week ? C.navy : "#94a3b8", minWidth: 52 }}
        >
          <option value="" disabled>Week</option>
          {PO_WEEK_OPTIONS.map((w) => (
            <option key={w} value={w}>
              W{w}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
