import { getComponentDescription, type PlantComponentRow } from "../data";

export function ComponentHeader({
  compCode,
  plantRows,
}: {
  compCode: string;
  plantRows: PlantComponentRow[];
}) {
  const firstRow = plantRows.find((r) => r.componentCode === compCode);
  const isRM = firstRow?.componentMaterialType === "1002";
  const description = getComponentDescription({
    componentCode: compCode,
    componentMaterialType: firstRow?.componentMaterialType ?? "1002",
    unrestrictedStock: 0,
    qualityStock: 0,
    blockedStock: 0,
    totalStock: 0,
    openPOStock: 0,
  });
  return (
    <div className="flex flex-col items-center gap-0.5 leading-tight">
      <span className="inline-flex items-center justify-center gap-1.5 flex-wrap">
        <span>{compCode}</span>
        <span
          className="inline-block px-1.5 py-0.5 rounded-full font-semibold"
          style={{
            backgroundColor: isRM
              ? "rgba(219,234,254,0.2)"
              : "rgba(237,233,254,0.2)",
            color: isRM ? "#bfdbfe" : "#ddd6fe",
            fontSize: 9,
          }}
        >
          {isRM ? "RM" : "PM"}
        </span>
      </span>
      <span
        className="font-normal truncate max-w-[220px] px-1"
        style={{ color: "#bfdbfe", fontSize: 9 }}
        title={description}
      >
        {description}
      </span>
    </div>
  );
}
