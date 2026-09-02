import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Check, Mail } from "lucide-react";
import type { ActionRow } from "./actionsData";

const SENT_RESET_MS = 2500;

interface Props {
  row: ActionRow;
}

/** Action column control — notifies the step owner by email. Automated (SAP)
 * steps have no human owner, so they show a plain "Automated" indicator instead. */
export function EmailActionCell({ row }: Props) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), SENT_RESET_MS);
    return () => clearTimeout(t);
  }, [sent]);

  if (row.automated) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
        title="Handled automatically by SAP — no recipient to email"
      >
        <Bot size={11} />
        Automated
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={sent}
      onClick={() => {
        setSent(true);
        toast.success(`Email sent to ${row.owner}`, {
          description: `${row.actionId} — ${row.description}`,
        });
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:cursor-default"
      style={
        sent
          ? { backgroundColor: "#dcfce7", color: "#15803d" }
          : { backgroundColor: "#ffffff", color: "#1565C0", border: "1px solid #93c5fd" }
      }
      onMouseEnter={(e) => {
        if (!sent) (e.currentTarget as HTMLElement).style.backgroundColor = "#eff6ff";
      }}
      onMouseLeave={(e) => {
        if (!sent) (e.currentTarget as HTMLElement).style.backgroundColor = "#ffffff";
      }}
    >
      {sent ? <Check size={12} /> : <Mail size={12} />}
      {sent ? "Sent" : "Send Email"}
    </button>
  );
}
