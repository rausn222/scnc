type AssumptionModalKey = "openpo" | "rmpm" | "iut" | "moq" | "materialScope" | "custom";

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
    const groupedRows = MATERIAL_SCOPE_DATA.reduce<Array<{ oldCbu: string; rows: MaterialScopeRow[] }>>((groups, row) => {
        const group = groups.find((item) => item.oldCbu === row.oldCbu);
        if (group) group.rows.push(row);
        else groups.push({ oldCbu: row.oldCbu, rows: [row] });
        return groups;
    }, []);

    return (
        <div className="p-5">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full border-collapse">
                    <thead className="bg-[#0b3b91] text-white">
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
                        {groupedRows.flatMap((group) => group.rows.map((row, index) => (
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
                                    <span className="font-semibold text-[#1454a3]">
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
                                        className="h-4 w-4 accent-[#1769c2]"
                                    />
                                </td>
                            </tr>
                        )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}