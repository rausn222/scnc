import { getComponentDescriptionByCode } from "../data";
import { C } from "./constants";

export function ComponentCodeWithDesc({
  code,
  description,
  className = "text-xs",
}: {
  code: string;
  description?: string;
  className?: string;
}) {
  const desc = description ?? getComponentDescriptionByCode(code);
  return (
    <div className={className}>
      <span className="font-medium" style={{ color: C.navy }}>
        {code}
      </span>
      {desc ? (
        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "#64748b" }}>
          {desc}
        </p>
      ) : null}
    </div>
  );
}
