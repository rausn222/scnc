import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, PlayCircle, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  nextStatusOptions,
  scenarioLabel,
  STATUS_THEME,
  type ActionRow,
  type ActionStatus,
} from "./actionsData";

const COMMENT_MAX = 500;

interface DecisionTheme {
  icon: LucideIcon;
  verb: string;
  banner: string;
  border: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  button: string;
}

const DECISION_THEME: Record<ActionStatus, DecisionTheme> = {
  PENDING: {
    icon: PlayCircle, verb: "Reset", banner: "#f3f4f6", border: "#e5e7eb",
    iconBg: "#e5e7eb", iconColor: "#4b5563", title: "#374151", subtitle: "#6b7280", button: "#6b7280",
  },
  INITIATED: {
    icon: PlayCircle, verb: "Initiate", banner: "#fffbeb", border: "#fde68a",
    iconBg: "#fef3c7", iconColor: "#b45309", title: "#92400e", subtitle: "#b45309", button: "#b45309",
  },
  "IN PROGRESS": {
    icon: PlayCircle, verb: "Start", banner: "#eff6ff", border: "#bfdbfe",
    iconBg: "#dbeafe", iconColor: "#1565C0", title: "#1e3a8a", subtitle: "#1d4ed8", button: "#1565C0",
  },
  COMPLETED: {
    icon: CheckCircle2, verb: "Complete", banner: "#effaf7", border: "#b7e4d8",
    iconBg: "#d7f2e9", iconColor: "#00695C", title: "#00473f", subtitle: "#00695C", button: "#00695C",
  },
};

const OPTION_LABEL: Record<ActionStatus, string> = {
  PENDING: "Pending",
  INITIATED: "Initiated",
  "IN PROGRESS": "In Progress",
  COMPLETED: "Completed",
};

interface Props {
  row: ActionRow;
  onConfirm: (rowId: string, action: string) => void;
}

/**
 * Status column control. Automated steps, and any manual step already
 * resolved to COMPLETED, show a plain read-only status pill. A step still in
 * flight gets a dropdown (its trigger doubles as the status pill) offering
 * only forward moves based on where it is now — PENDING can go to IN
 * PROGRESS or straight to COMPLETED, IN PROGRESS can only go to COMPLETED.
 * Picking one opens the confirm-with-comment dialog before it actually commits.
 */
export function StatusDropdownCell({ row, onConfirm }: Props) {
  const [pendingAction, setPendingAction] = useState<ActionStatus | null>(null);
  const [comment, setComment] = useState("");
  const statusTheme = STATUS_THEME[row.status];
  const options = nextStatusOptions(row.status);

  // Title Case ("In Progress") instead of the raw ALL-CAPS status value —
  // all-caps text reads visually larger than the mixed-case text in every
  // other column at the same font-size, so this is what keeps rows even.
  if (row.automated || options.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
        style={{ backgroundColor: statusTheme.bg, color: statusTheme.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusTheme.dot }} />
        {OPTION_LABEL[row.status]}
      </span>
    );
  }

  const theme = pendingAction ? DECISION_THEME[pendingAction] : DECISION_THEME[row.status];
  const Icon = theme.icon;
  const canSubmit = comment.trim().length > 0;

  function closeDialog() {
    setPendingAction(null);
    setComment("");
  }

  return (
    <>
      <Select value="" onValueChange={(v) => setPendingAction(v as ActionStatus)}>
        <SelectTrigger
          size="sm"
          className="h-7 w-[128px] text-xs font-semibold border-0 cursor-pointer [&_svg]:size-3.5 [&_svg]:opacity-100"
          style={{ backgroundColor: statusTheme.bg, color: statusTheme.text }}
          aria-label={`Status for ${row.actionId}`}
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusTheme.dot }} />
            {/* Always show the row's committed status, not the pending selection
                driving the dropdown value. */}
            <SelectValue placeholder={OPTION_LABEL[row.status]}>{OPTION_LABEL[row.status]}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {OPTION_LABEL[option]}
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
                {theme.verb} this action
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
                  toast.success(`${row.actionId} marked as ${OPTION_LABEL[pendingAction]}`, {
                    description: row.description,
                  });
                  closeDialog();
                }}
              >
                Submit & {theme.verb}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
