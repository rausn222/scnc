import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { C } from "../constants";

export function MonthYearInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  const toDisplay = (v: string) =>
    v.length === 7 ? `${v.slice(5, 7)}-${v.slice(0, 4)}` : "";

  const [text, setText] = useState(() => toDisplay(value));

  useEffect(() => {
    setText(toDisplay(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const m = raw.match(/^(\d{2})-(\d{4})$/);
    if (m) onChange(`${m[2]}-${m[1]}`);
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        title="Enter date in mm-yyyy format"
        placeholder="mm-yyyy"
        maxLength={7}
        className="text-xs px-2 py-1 pr-7 rounded-lg"
        style={{ border: "1px solid #d1d5db", color: text ? C.navy : "#94a3b8", width: 90 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => (hiddenRef.current as any)?.showPicker?.()}
        title="Open month picker"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
      >
        <Calendar size={12} style={{ color: "#94a3b8" }} />
      </button>
      <input
        ref={hiddenRef}
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}
