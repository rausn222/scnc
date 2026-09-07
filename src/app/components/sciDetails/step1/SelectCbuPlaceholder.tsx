import { Cpu } from "lucide-react";
import { C } from "../constants";

export function SelectCbuPlaceholder() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center text-center px-6 py-16"
      style={{
        border: "2px dashed #cbd5e1",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: C.bgBlue }}
      >
        <Cpu size={28} style={{ color: C.blue }} />
      </div>
      <p className="text-base font-bold mb-2" style={{ color: C.navy }}>
        Select Old CBU to begin simulation
      </p>
      <p className="text-sm mb-4" style={{ color: "#64748b" }}>
        The No Action scenario will compute automatically
      </p>
      <p className="text-xs" style={{ color: "#94a3b8" }}>
        → Choose an old finished good above. New CBU is optional for transition
        scenarios.
      </p>
    </div>
  );
}
