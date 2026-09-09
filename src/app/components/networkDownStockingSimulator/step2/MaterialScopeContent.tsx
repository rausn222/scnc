import { useMemo, useState } from "react";
import { TablePagination } from "../../nationalDashboard/TablePagination";

// Local one-off colors — no exact match in the shared C palette.
const TABLE_HEADER_BG = "#0b3b91";
const MATERIAL_CODE_COLOR = "#1454a3";
const CHECKBOX_ACCENT_COLOR = "#1769c2";

const DEFAULT_ROWS_PER_PAGE = 10;

type MaterialScopeRow = {
    materialType: "PM" | "RM";
    materialCode: string;
    description: string;
    oldCbu: string;
    contributionType: string;
    newCbuAssociated: string;
};
export const MATERIAL_SCOPE_DATA: MaterialScopeRow[] = [
    {
        oldCbu: "VAFA1R3",
        materialType: "PM",
        materialCode: "11477867",
        description: "VAS ALOE FRESH 100ML FENOMENO CAP",
        contributionType: "Unique",
        newCbuAssociated: "VCBL1R3",
    },
    {
        oldCbu: "VAFA1R0",
        materialType: "PM",
        materialCode: "11477877",
        description: "VAS ALOE FRESH 10ML FENOMENO CAP",
        contributionType: "High Contribution",
        newCbuAssociated: ""
    },
    {
        oldCbu: "VCBL1R0",
        materialType: "PM",
        materialCode: "11477887",
        description: "VAS ALOE FRESH 150ML FENOMENO CAP",
        contributionType: "High Contribution",
        newCbuAssociated: ""
    },
    {
        oldCbu: "VAFA1R3",
        materialType: "PM",
        materialCode: "65284824",
        description: "85ml Bottle Cap & Shrink Sleeve PM",
        contributionType: "Unique",
        newCbuAssociated: "VCBL1R3",
    },
    {
        oldCbu: "VCBL1R0",
        materialType: "PM",
        materialCode: "65284724",
        description: "85ml Bottle Cap & Shrink Sleeve1 PM",
        contributionType: "High Contribution",
        newCbuAssociated: "VCBL1R3",
    },
    {
        oldCbu: "VCBL1R0",
        materialType: "RM",
        materialCode: "11100345",
        description: "VAS ALOE FRESH 50ML",
        contributionType: "Unique",
        newCbuAssociated: "VAFA2R3"
    },
    {
        oldCbu: "VAFA1R3",
        materialType: "RM",
        materialCode: "11100335",
        description: "VAS ALOE FRESH 10ML",
        contributionType: "Unique",
        newCbuAssociated: "VCBL1R3",
    },
];
export default function MaterialScopeContent({
    selected,
    onToggle,
}: {
    selected: Record<string, boolean>;
    onToggle: (materialCode: string) => void;
}) {
    const groupedRows = useMemo(
        () =>
            MATERIAL_SCOPE_DATA.reduce<Array<{ oldCbu: string; rows: MaterialScopeRow[] }>>((groups, row) => {
                const group = groups.find((item) => item.oldCbu === row.oldCbu);
                if (group) group.rows.push(row);
                else groups.push({ oldCbu: row.oldCbu, rows: [row] });
                return groups;
            }, []),
        [],
    );

    // Flatten to one ordered row list (each entry keeps a reference back to its
    // group's oldCbu) so pagination can slice individual rows rather than whole
    // groups — a naive per-group slice wouldn't add up to a clean 10-row page.
    const flatRows = useMemo(
        () => groupedRows.flatMap((group) => group.rows.map((row) => ({ oldCbu: group.oldCbu, row }))),
        [groupedRows],
    );

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

    const totalRows = flatRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const safePage = Math.min(page, totalPages);
    const pagedFlatRows = flatRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    // Re-derive groups from just the paged subset so each rowSpan matches what's
    // actually rendered on this page. A group that straddles a page boundary
    // correctly renders its merged cell split across both pages.
    const pagedGroups = useMemo(() => {
        const groups: Array<{ oldCbu: string; rows: MaterialScopeRow[] }> = [];
        for (const { oldCbu, row } of pagedFlatRows) {
            const last = groups[groups.length - 1];
            if (last && last.oldCbu === oldCbu) last.rows.push(row);
            else groups.push({ oldCbu, rows: [row] });
        }
        return groups;
    }, [pagedFlatRows]);

    return (
        <div className="p-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="text-white" style={{ backgroundColor: TABLE_HEADER_BG }}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold">
                                    Old CBU
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold">
                                    Material Type, Code - Description
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold">
                                    Contribution Type
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold">
                                    New CBU Associated
                                </th>

                                <th className="px-4 py-3 text-center text-xs font-semibold w-40">
                                    Considered for Downstocking
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {pagedGroups.flatMap((group) => group.rows.map((row, index) => (
                                <tr
                                    key={`${row.materialCode}-${row.oldCbu}`}
                                    className="border-t border-slate-200 text-xs"
                                >
                                    {index === 0 && <td rowSpan={group.rows.length} className="px-4 py-3 align-top font-semibold">
                                        {group.oldCbu}
                                    </td>}

                                    <td className="px-4 py-3">
                                        <span className="font-medium">{row.materialType}</span>
                                        {", "}
                                        <span className="font-semibold" style={{ color: MATERIAL_CODE_COLOR }}>
                                            {row.materialCode}
                                        </span>
                                        {" - "}
                                        <span>{row.description}</span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {row.contributionType}
                                    </td>

                                    <td className="px-4 py-3">
                                        {row.newCbuAssociated}
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selected[row.materialCode] ?? !row.newCbuAssociated}
                                            onChange={() => onToggle(row.materialCode)}
                                            className="h-4 w-4"
                                            style={{ accentColor: CHECKBOX_ACCENT_COLOR }}
                                        />
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
                {totalRows > rowsPerPage && (
                    <TablePagination
                        page={safePage}
                        rowsPerPage={rowsPerPage}
                        totalRows={totalRows}
                        onPageChange={setPage}
                        onRowsPerPageChange={setRowsPerPage}
                    />
                )}
            </div>
        </div>
    );
}