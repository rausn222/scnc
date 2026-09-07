import { Check, ArrowLeftRight, Star, ShoppingCart, Zap, Pencil } from "lucide-react";
import type { ScenarioRow } from "./types";
import { C } from "./constants";

export function ScenarioIcon({
  icon,
  isAccepted,
}: {
  icon: ScenarioRow["icon"];
  isAccepted?: boolean;
}) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (icon) {
    case "no-action":
      return (
        <div
          className={base}
          style={{ backgroundColor: isAccepted ? C.blue : C.bgBlue }}
        >
          <Check
            size={16}
            color={isAccepted ? "#fff" : C.blue}
            strokeWidth={isAccepted ? 3 : 2}
          />
        </div>
      );
    case "iut":
      return (
        <div className={base} style={{ backgroundColor: C.bgBlue }}>
          <ArrowLeftRight size={16} style={{ color: C.blue }} />
        </div>
      );
    case "iut-moq":
      return (
        <div
          className={base}
          style={{ backgroundColor: isAccepted ? C.blue : "#ede9fe" }}
        >
          <Star
            size={16}
            style={{ color: isAccepted ? "#fff" : "#7c3aed" }}
            fill={isAccepted ? "currentColor" : "none"}
          />
        </div>
      );
    case "moq":
      return (
        <div className={base} style={{ backgroundColor: "#f3e8ff" }}>
          <ShoppingCart size={16} style={{ color: "#9333ea" }} />
        </div>
      );
    case "break":
      return (
        <div className={base} style={{ backgroundColor: "#fef3c7" }}>
          <Zap size={16} style={{ color: "#d97706" }} />
        </div>
      );
    case "custom":
      return (
        <div className={base} style={{ backgroundColor: "#ecfdf5" }}>
          <Pencil size={16} style={{ color: "#e11d48" }} />
        </div>
      );
  }
}
