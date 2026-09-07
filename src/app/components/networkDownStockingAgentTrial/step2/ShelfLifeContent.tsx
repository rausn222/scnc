import { C, PM_BADGE, RM_BADGE } from "../../sciDetails/constants";
import { ComponentCodeWithDesc } from "../../sciDetails/ComponentCodeWithDesc";
import { SHELF_LIFE_DATA } from "./SimulationAssumptionsStep";

export type ShelfLifeRow = {
    plant: string;
    materialType: "RM" | "PM";
    materialCode: string;
    description: string;
    batchNumber: string;
    expiryDate: string;
};
const SHELF_LIFE_THRESHOLD_HELP =
    "Minimum shelf life for material to be considered for IUT";
export function getShelfLifeRowKey(row: ShelfLifeRow) {
    return `${row.materialType}-${row.materialCode}`;
}

export function ShelfLifeContent({
    thresholds,
    onThresholdChange,
}: {
    thresholds: Record<string, string>;
    onThresholdChange: (rowKey: string, value: string) => void;
}) {
    return (
        <div className="px-6 py-5">
            <div
                className="overflow-x-auto rounded-lg"
                style={{ border: "1px solid #e2e8f0" }}
            >
                <table className="w-full min-w-[760px] text-xs">
                    <thead>
                        <tr style={{ backgroundColor: C.navy }}>
                        {[
                            "RM/PM",
                            "MATERIAL",
                            "PLANT",
                            "BATCH NUMBER",
                            "EXPIRY DATE",
                            "THRESHOLD",
                        ].map((heading) => (
                            <th
                                key={heading}
                                title={
                                    heading === "THRESHOLD"
                                        ? SHELF_LIFE_THRESHOLD_HELP
                                        : undefined
                                }
                                className="px-3 py-2.5 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{
                                    color: "#ffffff",
                                    fontSize: 9,
                                    cursor: heading === "THRESHOLD" ? "help" : undefined,
                                }}
                            >
                                {heading}
                            </th>
                        ))}
                        </tr>
                    </thead>

                    <tbody>
                        {Array.from(
                            new Map(
                                SHELF_LIFE_DATA.map((row) => [getShelfLifeRowKey(row), row]),
                            ).keys(),
                        ).map((materialKey) => {
                            const materialRows = SHELF_LIFE_DATA.filter(
                                (row) => getShelfLifeRowKey(row) === materialKey,
                            );
                            const row = materialRows[0];
                            const rowKey = getShelfLifeRowKey(row);

                            const badge =
                                row.materialType === "RM" ? RM_BADGE : PM_BADGE;

                            return materialRows.map((detailRow, detailIndex) => (
                                <tr
                                    key={getShelfLifeRowKey(detailRow) + detailRow.plant + detailRow.batchNumber}
                                    className="bg-white hover:bg-blue-50"
                                    style={{ borderTop: detailIndex === 0 ? "1px solid #f1f5f9" : undefined }}
                                >
                                    {detailIndex === 0 && <td rowSpan={materialRows.length} className="px-3 py-2.5 align-middle">
                                        <span
                                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                                            style={{
                                                backgroundColor: badge.bg,
                                                color: badge.color,
                                            }}
                                        >
                                            {row.materialType}
                                        </span>
                                    </td>}

                                    {detailIndex === 0 && <td rowSpan={materialRows.length} className="px-3 py-2.5 align-middle">
                                        <ComponentCodeWithDesc
                                            code={row.materialCode}
                                            description={row.description}
                                        />
                                    </td>}
                                    <td className="px-3 py-2.5">
                                        <span
                                            className="whitespace-nowrap font-semibold"
                                            style={{ color: C.blue }}
                                        >
                                            {detailRow.plant}
                                        </span>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <span
                                            className="whitespace-nowrap font-semibold tabular-nums"
                                            style={{ color: C.navy }}
                                        >
                                            {detailRow.batchNumber}
                                        </span>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <span
                                            className="whitespace-nowrap font-semibold tabular-nums"
                                            style={{ color: C.navy }}
                                        >
                                            {detailRow.expiryDate}
                                        </span>
                                    </td>

                                    {detailIndex === 0 && <td rowSpan={materialRows.length} className="px-3 py-2.5 align-middle">
                                        <div className="relative w-28">
                                            <input
                                                type="number"
                                                min={0}
                                                max={30}
                                                step={1}
                                                placeholder=""
                                                value={thresholds[rowKey] ?? ""}
                                                onChange={(event) => {
                                                    const value = event.target.value;

                                                    if (
                                                        value === "" ||
                                                        Number(value) <= 30
                                                    ) {
                                                        onThresholdChange(rowKey, value);
                                                    }
                                                }}
                                                aria-label={`Shelf-life threshold for material ${row.materialCode}. ${SHELF_LIFE_THRESHOLD_HELP}`}
                                                className="w-full rounded-md border border-slate-300 py-1.5 pl-2 pr-10 text-xs text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />

                                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                                days
                                            </span>
                                        </div>
                                    </td>}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}