import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { C } from "../actionDetails/theme";

type ActionDropdownProps = Readonly<{
    value: string;
    options: string[];
    onActionRequested: (action: string) => void;
    placeholder?: string;
    disabled?: boolean;
}>;

/**
 * Searchable, single-select Action dropdown.
 *
 * Selecting an option does not directly commit the action.
 * Instead, `onActionRequested` is called so the parent can
 * open the comment popup and commit the action after submission.
 */
export function ActionDropdown({
    value,
    options,
    onActionRequested,
    placeholder = "Select Action",
    disabled = false,
}: ActionDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [panelStyle, setPanelStyle] =
        useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    /**
     * Removes empty and duplicate options.
     */
    const uniqueOptions = useMemo(() => {
        return Array.from(
            new Set(
                options
                    .map((option) => option.trim())
                    .filter((option) => option.length > 0),
            ),
        );
    }, [options]);

    /**
     * Filters options using the dropdown's own search box.
     */
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return uniqueOptions;
        }

        return uniqueOptions.filter((option) =>
            option.toLowerCase().includes(query),
        );
    }, [search, uniqueOptions]);

    /**
     * Calculates dropdown position because the panel is rendered
     * into document.body using a portal.
     */
    const updatePanelPosition = useCallback(() => {
        if (!buttonRef.current) {
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const viewportPadding = 16;
        const panelGap = 6;
        const minimumPanelWidth = 180;

        const availableWidth = Math.max(
            rect.width,
            window.innerWidth - rect.left - viewportPadding,
        );

        setPanelStyle({
            position: "fixed",
            top: rect.bottom + panelGap,
            left: rect.left,
            minWidth: Math.max(rect.width, minimumPanelWidth),
            width: "max-content",
            maxWidth: availableWidth,
            zIndex: 9999,
        });
    }, []);

    /**
     * Closes the dropdown and resets the internal search.
     */
    const closePanel = useCallback(() => {
        setOpen(false);
        setSearch("");
    }, []);

    /**
     * Opens or closes the dropdown.
     */
    const togglePanel = () => {
        if (disabled) {
            return;
        }

        if (!open) {
            updatePanelPosition();
        }

        setOpen((currentOpen) => !currentOpen);
    };

    /**
     * Keeps the portal panel aligned with its trigger when
     * the window or a scrollable parent moves.
     */
    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updatePanelPosition();

        window.addEventListener("resize", updatePanelPosition);
        window.addEventListener(
            "scroll",
            updatePanelPosition,
            true,
        );

        return () => {
            window.removeEventListener(
                "resize",
                updatePanelPosition,
            );
            window.removeEventListener(
                "scroll",
                updatePanelPosition,
                true,
            );
        };
    }, [open, updatePanelPosition]);

    /**
     * Focuses the search input when the dropdown opens.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [open]);

    /**
     * Handles outside click and Escape.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target;

            if (!(target instanceof Node)) {
                return;
            }

            const clickedInsideTrigger =
                containerRef.current?.contains(target) ?? false;

            const clickedInsidePanel =
                target instanceof Element &&
                target.closest("[data-action-dropdown-panel]") !== null;

            if (!clickedInsideTrigger && !clickedInsidePanel) {
                closePanel();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            closePanel();
            buttonRef.current?.focus();
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );
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

    /**
     * Closes the dropdown before requesting the action popup.
     * The parent commits the action only after comment submission.
     */
    const handleOptionSelect = (option: string) => {
        closePanel();
        onActionRequested(option);
    };

    const displayValue = value || placeholder;

    const panel = open ? (
        <div
            data-action-dropdown-panel
            className="overflow-hidden rounded-lg"
            style={{
                ...panelStyle,
                backgroundColor: "#ffffff",
                border: "1.5px solid #93c5fd",
                boxShadow: "0 8px 24px rgba(21,101,192,0.15)",
            }}
        >
            {/* Search input */}
            <div
                className="p-2"
                style={{
                    borderBottom: "1px solid #e5e7eb",
                }}
            >
                <div className="relative">
                    <Search
                        size={12}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: "#94a3b8" }}
                    />

                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                        }}
                        onMouseDown={(event) => {
                            event.stopPropagation();
                        }}
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" &&
                                filteredOptions.length === 1
                            ) {
                                event.preventDefault();
                                handleOptionSelect(filteredOptions[0]);
                            }
                        }}
                        placeholder="Search Action"
                        title="Search Action"
                        aria-label="Search Action"
                        className="w-full rounded-md py-1.5 pl-7 pr-2.5 text-xs focus:outline-none"
                        style={{
                            border: "1.5px solid #93c5fd",
                            color: "#111827",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    />
                </div>
            </div>

            {/* Action options */}
            <ul
                className="max-h-[220px] overflow-y-auto py-1"
                role="listbox"
                aria-label="Available actions"
            >
                {filteredOptions.length === 0 ? (
                    <li
                        className="px-3 py-4 text-center text-xs"
                        style={{ color: "#94a3b8" }}
                    >
                        No matches
                    </li>
                ) : (
                    filteredOptions.map((option) => {
                        const selected = value === option;

                        return (
                            <li key={option}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    title={
                                        selected
                                            ? `${option} is currently selected`
                                            : `Select ${option}`
                                    }
                                    onClick={() => {
                                        handleOptionSelect(option);
                                    }}
                                    className="w-full cursor-pointer whitespace-nowrap px-3 py-2 text-left text-xs transition-colors"
                                    style={{
                                        backgroundColor: selected
                                            ? "#dbeafe"
                                            : "transparent",
                                        color: selected ? C.blue : "#111827",
                                        fontWeight: selected ? 600 : 400,
                                        fontFamily:
                                            "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    onMouseEnter={(event) => {
                                        if (!selected) {
                                            event.currentTarget.style.backgroundColor =
                                                "#f8fafc";
                                        }
                                    }}
                                    onMouseLeave={(event) => {
                                        if (!selected) {
                                            event.currentTarget.style.backgroundColor =
                                                "transparent";
                                        }
                                    }}
                                >
                                    {option}
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
            className="relative w-[150px] min-w-0"
            onClick={(event) => {
                /*
                 * Prevents clicks within this table cell control from
                 * toggling the parent action-group row.
                 */
                event.stopPropagation();
            }}
        >
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={togglePanel}
                aria-expanded={open}
                aria-haspopup="listbox"
                title={displayValue}
                className="w-full appearance-none truncate rounded-full py-1.5 pl-2.5 pr-7 text-left text-xs transition-all focus:outline-none"
                style={{
                    backgroundColor: disabled ? "#f8fafc" : "#ffffff",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: disabled
                        ? "#e2e8f0"
                        : open
                            ? C.blue
                            : "#d1d5db",
                    color: disabled
                        ? "#cbd5e1"
                        : value
                            ? "#111827"
                            : "#94a3b8",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 500,
                    cursor: disabled ? "not-allowed" : "pointer",
                }}
            >
                {displayValue}
            </button>

            <ChevronDown
                size={11}
                aria-hidden
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                style={{
                    color: disabled ? "#cbd5e1" : "#6b7280",
                    transform: open
                        ? "translateY(-50%) rotate(180deg)"
                        : "translateY(-50%) rotate(0deg)",
                    transition: "transform 150ms ease",
                }}
            />

            {panel && createPortal(panel, document.body)}
        </div>
    );
}