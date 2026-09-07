import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { C } from "../constants";

export function DateWeekEditor({
  date,
  onChange,
}: {
  date: string; // "dd-mm-yyyy"
  onChange: (date: string) => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const toIso = (v: string) => {
    const m = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  const fromIso = (v: string) => {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  const calcWeek = (v: string) => {
    const m = v.match(/^(\d{2})-\d{2}-\d{4}$/);
    return m ? Math.min(5, Math.ceil(parseInt(m[1]) / 7)) : null;
  };

  const [text, setText] = useState(date);

  useEffect(() => {
    setText(date);
  }, [date]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) onChange(raw);
  };

  const week = calcWeek(date);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          title="Enter date in dd-mm-yyyy format"
          placeholder="dd-mm-yyyy"
          maxLength={10}
          className="text-xs px-2 py-1 pr-7 rounded-lg"
          style={{ border: "1px solid #d1d5db", color: text ? C.navy : "#94a3b8", width: 130 }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => (hiddenRef.current as any)?.showPicker?.()}
          title="Open date picker"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <Calendar size={12} style={{ color: "#94a3b8" }} />
        </button>
        <input
          ref={hiddenRef}
          type="date"
          value={toIso(date)}
          onChange={(e) => onChange(fromIso(e.target.value))}
          tabIndex={-1}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>
      {week !== null && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{ backgroundColor: C.bgBlue, color: C.blue }}
        >
          Week {week}
        </span>
      )}
    </div>
  );
}
