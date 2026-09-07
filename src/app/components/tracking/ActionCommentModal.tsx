import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import { createPortal } from "react-dom";
import { C } from "../actionDetails/theme";

const ACTION_MESSAGES: Record<
    string,
    {
        title: string;
        message: string;
        submitLabel: string;
    }
> = {
    Accept: {
        title: "Accept this action",
        message:
            "You are about to accept this action. Please add a comment explaining the decision before submitting.",
        submitLabel: "Submit & Accept",
    },
    Reject: {
        title: "Reject this action",
        message:
            "You are about to reject this action. Please explain why this action cannot be accepted.",
        submitLabel: "Submit & Reject",
    },
    Reassign: {
        title: "Reassign this action",
        message:
            "You are about to reassign this action. Please add a comment describing why reassignment is required.",
        submitLabel: "Submit & Reassign",
    },
    Escalate: {
        title: "Escalate this action",
        message:
            "You are about to escalate this action. Please describe the issue and why escalation is required.",
        submitLabel: "Submit & Escalate",
    },
    Close: {
        title: "Close this action",
        message:
            "You are about to close this action. Please add a closing comment before submitting.",
        submitLabel: "Submit & Close",
    },
};

interface ActionCommentModalProps {
    open: boolean;
    actionName: string | null;
    actionId: string;
    onCancel: () => void;
    onSubmit: (comment: string) => void;
}

export function ActionCommentModal({
    open,
    actionName,
    actionId,
    onCancel,
    onSubmit,
}: Readonly<ActionCommentModalProps>) {
    const [comment, setComment] = useState("");
    const [showValidation, setShowValidation] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const content =
        actionName && ACTION_MESSAGES[actionName]
            ? ACTION_MESSAGES[actionName]
            : {
                title: actionName
                    ? `${actionName} this action`
                    : "Update this action",
                message:
                    "Please add a comment explaining this action before submitting.",
                submitLabel: actionName
                    ? `Submit & ${actionName}`
                    : "Submit",
            };

    useEffect(() => {
        if (!open) {
            setComment("");
            setShowValidation(false);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleEscape);

        return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, onCancel]);

    if (!open || !actionName) {
        return null;
    }

    const trimmedComment = comment.trim();
    const isCommentInvalid =
        showValidation && trimmedComment.length === 0;

    const handleSubmit = () => {
        if (!trimmedComment) {
            setShowValidation(true);
            textareaRef.current?.focus();
            return;
        }

        onSubmit(trimmedComment);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onCancel();
                }
            }}
            style={{
                backgroundColor: "rgba(15, 23, 42, 0.42)",
                backdropFilter: "blur(1px)",
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="action-comment-title"
                aria-describedby="action-comment-message"
                className="w-full max-w-[560px] overflow-hidden rounded-[20px] bg-white"
                style={{
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
                }}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Context header */}
                <div
                    className="relative flex items-start gap-4 px-6 py-5"
                    style={{
                        backgroundColor: "#fffbeb",
                        borderBottom: "1px solid #fde7c2",
                    }}
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{
                            backgroundColor: "#fef3c7",
                            color: "#f59e0b",
                        }}
                    >
                        <Star size={19} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1 pr-7">
                        <h2
                            id="action-comment-title"
                            className="text-base font-bold"
                            style={{ color: "#92400e" }}
                        >
                            {content.title}
                        </h2>

                        <p
                            id="action-comment-message"
                            className="mt-1 text-sm leading-5"
                            style={{ color: "#b45309" }}
                        >
                            {content.message}
                        </p>

                        <p
                            className="mt-1 text-xs font-semibold"
                            style={{ color: "#92400e" }}
                        >
                            Action ID: {actionId}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        title="Close"
                        aria-label="Close action comment popup"
                        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                        style={{ color: "#92400e" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Comment area */}
                <div className="px-6 pb-5 pt-4">
                    <label
                        htmlFor={`action-comment-${actionId}`}
                        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: "#374151" }}
                    >
                        Comments
                    </label>

                    <textarea
                        ref={textareaRef}
                        id={`action-comment-${actionId}`}
                        value={comment}
                        onChange={(event) => {
                            setComment(event.target.value);

                            if (event.target.value.trim()) {
                                setShowValidation(false);
                            }
                        }}
                        placeholder="Enter your reason here..."
                        rows={5}
                        maxLength={500}
                        className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                        style={{
                            border: isCommentInvalid
                                ? "2px solid #dc2626"
                                : `2px solid ${C.navy}`,
                            color: "#111827",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    />

                    <div className="mt-1 flex items-center justify-between">
                        <span
                            className="text-xs"
                            style={{
                                color: isCommentInvalid
                                    ? "#dc2626"
                                    : "#94a3b8",
                            }}
                        >
                            {isCommentInvalid
                                ? "A comment is required to submit this action."
                                : "Add a clear reason for the selected action."}
                        </span>

                        <span
                            className="text-[10px]"
                            style={{ color: "#94a3b8" }}
                        >
                            {comment.length}/500
                        </span>
                    </div>

                    {/* Footer buttons */}
                    <div className="mt-4 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex h-9 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors"
                            style={{
                                backgroundColor: "#e2e8f0",
                                color: "#64748b",
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="flex h-9 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition-colors"
                            style={{
                                backgroundColor: C.blue,
                            }}
                        >
                            {content.submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}