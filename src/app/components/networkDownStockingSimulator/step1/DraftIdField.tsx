import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { C } from "../../sciDetails/constants";
import { useDraftListQuery } from "../../../queries/networkDownStockingSimulator";
import type { DraftRecord } from "../../../api/networkDownStockingSimulator";

// Panel chrome/tints with no matching C.* token — kept file-local so parallel
// edits to constants.ts don't conflict (see step1 refactor notes).
const PANEL_BORDER = `1.5px solid ${C.borderBlue}`;
const PANEL_SHADOW = "0 8px 24px rgba(21,101,192,0.15)";
const DIVIDER_BORDER = "1px solid #e5e7eb";
const SELECTED_OPTION_BG = "#dbeafe";
const DEFAULT_TRIGGER_BORDER = "#d1d5db";
const FONT_FAMILY = "'Plus Jakarta Sans', sans-serif";
// Panel is portaled to document.body, so it must out-rank all page content.
const DROPDOWN_PANEL_Z_INDEX = 9999;

export type { DraftRecord };

interface DraftIdFieldProps {
    value: string;
    onChange: (draft: DraftRecord | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function DraftIdField({
    value,
    onChange,
    label = "Draft ID",
    placeholder = "Select Draft ID",
    disabled = false,
}: DraftIdFieldProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [panelStyle, setPanelStyle] =
        useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { data: drafts = [] } = useDraftListQuery();

    const selectedDraft = useMemo(
        () => drafts.find((draft) => draft.id === value) ?? null,
        [drafts, value],
    );

    const filteredDrafts = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return drafts;
        }

        return drafts.filter(
            (draft) =>
                draft.id.toLowerCase().includes(query) ||
                draft.projectName.toLowerCase().includes(query),
        );
    }, [drafts, search]);

    const updatePanelPosition = useCallback(() => {
        if (!buttonRef.current) {
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const availableWidth = window.innerWidth - rect.left - 16;

        setPanelStyle({
            position: "fixed",
            top: rect.bottom + 6,
            left: rect.left,
            minWidth: Math.max(rect.width, 280),
            width: "max-content",
            maxWidth: Math.max(rect.width, availableWidth),
            zIndex: DROPDOWN_PANEL_Z_INDEX,
        });
    }, []);

    const closePanel = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updatePanelPosition();

        window.addEventListener("resize", updatePanelPosition);
        window.addEventListener("scroll", updatePanelPosition, true);

        return () => {
            window.removeEventListener("resize", updatePanelPosition);
            window.removeEventListener(
                "scroll",
                updatePanelPosition,
                true,
            );
        };
    }, [open, updatePanelPosition]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const targetElement = event.target as Element;

            const clickedInsideTrigger =
                containerRef.current?.contains(target);

            const clickedInsidePanel = targetElement.closest(
                "[data-draft-dropdown-panel]",
            );

            if (!clickedInsideTrigger && !clickedInsidePanel) {
                closePanel();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePanel();
                buttonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
            document.removeEventListener(
                "keydown",
                handleEscape,
            );
        };
    }, [open, closePanel]);

    const handleDraftSelect = (draft: DraftRecord) => {
        onChange(draft);
        closePanel();
    };

    const handleClear = (
        event:
            | React.MouseEvent<HTMLElement>
            | React.KeyboardEvent<HTMLElement>,
    ) => {
        event.stopPropagation();
        onChange(null);
        closePanel();
    };

    const displayValue = selectedDraft?.id ?? placeholder;

    const panel = open ? (
        <div
            data-draft-dropdown-panel
            className="overflow-hidden rounded-lg"
            style={{
                ...panelStyle,
                backgroundColor: C.white,
                border: PANEL_BORDER,
                boxShadow: PANEL_SHADOW,
            }}
        >
            {/* Search */}
            <div
                className="p-2"
                style={{ borderBottom: DIVIDER_BORDER }}
            >
                <div className="relative">
                    <Search
                        size={12}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: C.borderMuted }}
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        title={`Search ${label}`}
                        placeholder="Search"
                        className="w-full rounded-md py-1.5 pl-7 pr-2.5 text-xs focus:outline-none"
                        style={{
                            border: PANEL_BORDER,
                            color: C.text,
                            fontFamily: FONT_FAMILY,
                        }}
                        autoFocus
                        onMouseDown={(event) => event.stopPropagation()}
                    />
                </div>
            </div>

            {/* Draft options */}
            <ul className="max-h-[320px] overflow-y-auto py-1" role="listbox">
                {filteredDrafts.length === 0 ? (
                    <li
                        className="px-3 py-4 text-center text-xs"
                        style={{ color: C.borderMuted }}
                    >
                        No matches
                    </li>
                ) : (
                    filteredDrafts.map((draft) => {
                        const selected = draft.id === value;

                        return (
                            <li key={draft.id}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => handleDraftSelect(draft)}
                                    className="w-full px-3 py-2 text-left text-xs cursor-pointer transition-colors"
                                    style={{
                                        backgroundColor: selected
                                            ? SELECTED_OPTION_BG
                                            : "transparent",
                                        color: selected
                                            ? C.blue
                                            : C.text,
                                        fontWeight: selected
                                            ? 600
                                            : 400,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selected) {
                                            e.currentTarget.style.backgroundColor =
                                                C.bgSlateLight;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selected) {
                                            e.currentTarget.style.backgroundColor =
                                                "transparent";
                                        }
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span>{draft.id}</span>
                                    </div>
                                </button>
                            </li>
                        );
                    })
                )}
            </ul>

        </div>
    ) : null;

    return (
        <div
            ref={containerRef}
            className="relative w-full min-w-0"
        >
            <p
                className="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide"
                style={{
                    color: disabled ? C.borderMuted : C.textSecondary,
                }}
                title={label}
            >
                {label}
            </p>

            <div className="relative w-full min-w-0">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => {
                        if (disabled) {
                            return;
                        }

                        if (!open) {
                            updatePanelPosition();
                        }

                        setOpen((currentOpen) => !currentOpen);
                    }}
                    disabled={disabled}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    title={displayValue}
                    className="w-full appearance-none truncate rounded-full py-1.5 pl-2.5 pr-7 text-left text-xs transition-all focus:outline-none"
                    style={{
                        backgroundColor: disabled
                            ? C.bgSlateLight
                            : C.white,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: disabled
                            ? C.border
                            : open
                                ? C.blue
                                : DEFAULT_TRIGGER_BORDER,
                        color: disabled
                            ? C.borderLight
                            : selectedDraft
                                ? C.text
                                : C.borderMuted,
                        fontFamily: FONT_FAMILY,
                        fontWeight: 500,
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                >
                    {displayValue}
                </button>

                {selectedDraft && !disabled && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClear}
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                handleClear(event);
                            }
                        }}
                        title="Clear selected Draft ID"
                        aria-label="Clear selected Draft ID"
                        className="absolute right-6 top-1/2 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors"
                        style={{ color: C.borderMuted }}
                    >
                        <X size={11} />
                    </span>
                )}

                <ChevronDown
                    size={11}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                    style={{
                        color: disabled ? C.borderLight : C.mutedLight,
                    }}
                />
            </div>

            {panel && createPortal(panel, document.body)}
        </div>
    );
}