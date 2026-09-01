import { useState } from "react";
import { toast } from "sonner";
import { Bot, Star, XCircle, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { scenarioLabel, type ActionRow, type ActionStatus } from "./actionsData";

const ACTION_TO_STATUS: Record<string, ActionStatus> = {
  Approve: "APPROVED",
  Reject: "REJECTED",
};

const COMMENT_MAX = 500;

interface DecisionTheme {
  icon: LucideIcon;
  banner: string;
  border: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  button: string;
}

const DECISION_THEME: Record<string, DecisionTheme> = {
  Approve: {
    icon: Star,
    banner: "#fef9e7",
    border: "#fde8b0",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    title: "#92400e",
    subtitle: "#92610f",
    button: "#1565C0",
  },
  Reject: {
    icon: XCircle,
    banner: "#fef2f2",
    border: "#fecaca",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    title: "#991b1b",
    subtitle: "#b91c1c",
    button: "#b91c1c",
  },
};

const DEFAULT_THEME: DecisionTheme = DECISION_THEME.Approve;

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
  const [comment, setComment] = useState("");

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
  const theme = (pendingAction && DECISION_THEME[pendingAction]) || DEFAULT_THEME;
  const Icon = theme.icon;
  const canSubmit = comment.trim().length > 0;

  function closeDialog() {
    setPendingAction(null);
    setComment("");
  }

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

      <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          {/* Banner */}
          <div className="flex items-start gap-3 px-6 pt-5 pb-4" style={{ backgroundColor: theme.banner, borderBottom: `1px solid ${theme.border}` }}>
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
              style={{ backgroundColor: theme.iconBg }}
            >
              <Icon size={17} style={{ color: theme.iconColor }} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-base" style={{ color: theme.title }}>
                {pendingAction} this action
              </p>
              <p className="text-sm mt-0.5" style={{ color: theme.subtitle }}>
                Please add a comment explaining this action before submitting.
              </p>
              <p className="text-sm mt-1.5 font-semibold" style={{ color: theme.title }}>
                {row.description}
                <span className="font-normal"> · {scenarioLabel(row.scenarioType, row.seq)}</span>
              </p>
            </div>
          </div>

          {/* Comment */}
          <div className="px-6 pt-4 pb-5">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#374151" }}>
              Comments
            </label>
            <textarea
              autoFocus
              value={comment}
              maxLength={COMMENT_MAX}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your reason here…"
              rows={4}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none transition-colors"
              style={{ border: "1px solid #1565C0", color: "#111827" }}
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs" style={{ color: "#6b7280" }}>
                Add a clear reason for the selected action.
              </span>
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                {comment.length}/{COMMENT_MAX}
              </span>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                disabled={!canSubmit}
                style={{ backgroundColor: theme.button }}
                onClick={() => {
                  if (!pendingAction || !canSubmit) return;
                  onConfirm(row.id, pendingAction);
                  toast.success(`${row.actionId} marked as ${pendingAction}`, {
                    description: row.description,
                  });
                  closeDialog();
                }}
              >
                Submit & {pendingAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
