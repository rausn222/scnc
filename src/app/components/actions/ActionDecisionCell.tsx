import { useState } from "react";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type { ActionRow, ActionStatus } from "./actionsData";

const ACTION_TO_STATUS: Record<string, ActionStatus> = {
  Approve: "APPROVED",
  Reject: "REJECTED",
};

/** Maps a row's current committed status back to the dropdown value that produced it. */
function currentSelection(row: ActionRow): string {
  return Object.entries(ACTION_TO_STATUS).find(
    ([, status]) => status === row.status,
  )?.[0] ?? "";
}

interface Props {
  row: ActionRow;
  onConfirm: (rowId: string, action: string) => void;
}

export function ActionDecisionCell({ row, onConfirm }: Props) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  if (row.availableActions.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium"
        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
        title="Handled automatically by SAP — no manual action required"
      >
        <Bot size={11} />
        Automated
      </span>
    );
  }

  const selected = currentSelection(row);

  return (
    <>
      <Select value={selected} onValueChange={(v) => setPendingAction(v)}>
        <SelectTrigger
          size="sm"
          className="h-7 w-[112px] text-xs bg-white"
          aria-label={`Action for ${row.actionId}`}
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {row.availableActions.map((action) => (
            <SelectItem key={action} value={action} className="text-xs">
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm action</DialogTitle>
            <DialogDescription asChild>
              <span>
                Mark <b>{row.actionId} — {row.description}</b> as{" "}
                <b>{pendingAction}</b>? {row.owner} will be notified and this
                cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              style={{ backgroundColor: "#1565C0" }}
              onClick={() => {
                if (!pendingAction) return;
                onConfirm(row.id, pendingAction);
                toast.success(`${row.actionId} marked as ${pendingAction}`, {
                  description: row.description,
                });
                setPendingAction(null);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
