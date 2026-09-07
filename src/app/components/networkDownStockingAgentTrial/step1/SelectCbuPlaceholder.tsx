import { Cpu } from "lucide-react";
import { C } from "../../sciDetails/constants";

export function SelectCbuPlaceholder() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center text-center px-6 py-10"
      style={{
        border: "2px dashed #cbd5e1",
        backgroundColor: "#f8fafc",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: C.bgBlue }}
      >
        <Cpu size={22} style={{ color: C.blue }} />
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: C.navy }}>
        Select Old CBU to begin simulation
      </p>
      <p className="text-xs mb-2" style={{ color: "#64748b" }}>
        The No Action scenario will compute automatically
      </p>
      <p className="text-xs" style={{ color: "#94a3b8" }}>
        → Choose an old finished good above. New CBU is optional for transition
        scenarios.
      </p>
    </div>
  );
}
