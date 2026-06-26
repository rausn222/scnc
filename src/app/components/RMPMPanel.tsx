import { X, Package, ChevronDown } from "lucide-react";
import { rmpmDataByCode, type RMPMRow } from "./data";

interface Props {
  cbuCode: string;
  cbuDescription: string;
  onClose: () => void;
}

const locations: Record<string, string> = {
  UTR: "Unilever Taloja (UTR)",
  U871: "Unilever Khopoli (U871)",
  U535: "Unilever Doom Dooma (U535)",
  ULU: "Unilever Lucknow (ULU)",
  U872: "Unilever Haridwar (U872)",
};

function groupByLocation(rows: RMPMRow[]) {
  const map: Record<string, RMPMRow[]> = {};
  for (const r of rows) {
    if (!map[r.plantco]) map[r.plantco] = [];
    map[r.plantco].push(r);
  }
  return map;
}

export function RMPMPanel({ cbuCode, cbuDescription, onClose }: Props) {
  const rows = rmpmDataByCode[cbuCode] ?? [];
  const grouped = groupByLocation(rows);

  const allLocs = Array.from(new Set(rows.map(r => r.plantco)));

  return (
    <div className="border-t-2 border-blue-200 bg-blue-50/60 animate-in slide-in-from-top-2 duration-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-indigo-700 to-indigo-500 text-white">
        <div className="flex items-center gap-3">
          <Package size={16} />
          <div>
            <span className="font-semibold text-sm">{cbuCode}</span>
            <span className="text-indigo-200 text-xs ml-2">— RM/PM Stock Availability Across Locations</span>
          </div>
          <span className="text-indigo-200 text-xs truncate max-w-xs hidden md:inline">{cbuDescription}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 overflow-x-auto">
        {rows.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic text-sm">No RM/PM data available for this CBU.</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="bg-indigo-600 text-white px-3 py-2.5 text-left font-semibold border border-indigo-500 whitespace-nowrap">Plant</th>
                <th className="bg-indigo-600 text-white px-3 py-2.5 text-left font-semibold border border-indigo-500 whitespace-nowrap">FG Material</th>
                <th className="bg-indigo-600 text-white px-3 py-2.5 text-left font-semibold border border-indigo-500 whitespace-nowrap">Component Code</th>
                <th className="bg-indigo-600 text-white px-3 py-2.5 text-left font-semibold border border-indigo-500 whitespace-nowrap">Type</th>
                <th className="bg-indigo-600 text-white px-3 py-2.5 text-right font-semibold border border-indigo-500 whitespace-nowrap">Conv. Factor</th>
                <th className="bg-green-600 text-white px-3 py-2.5 text-right font-semibold border border-green-500 whitespace-nowrap">Unrestricted Stock</th>
                <th className="bg-yellow-600 text-white px-3 py-2.5 text-right font-semibold border border-yellow-500 whitespace-nowrap">Quality Stock</th>
                <th className="bg-red-600 text-white px-3 py-2.5 text-right font-semibold border border-red-500 whitespace-nowrap">Blocked Stock</th>
                <th className="bg-indigo-800 text-white px-3 py-2.5 text-right font-semibold border border-indigo-700 whitespace-nowrap">Total Stock</th>
                <th className="bg-blue-500 text-white px-3 py-2.5 text-right font-semibold border border-blue-400 whitespace-nowrap">In-Transit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white hover:bg-indigo-50 transition-colors" : "bg-indigo-50/40 hover:bg-indigo-100/50 transition-colors"}
                >
                  <td className="px-3 py-2 border border-gray-200 font-medium text-indigo-700">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                      {r.plantco}
                    </span>
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-700">{r.fgMaterial}</td>
                  <td className="px-3 py-2 border border-gray-200 font-mono text-gray-800">{r.componentCode}</td>
                  <td className="px-3 py-2 border border-gray-200 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">{r.componentMaterialType}</span>
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-right font-mono text-gray-600">{r.conversionFactor}</td>
                  <StockCell value={r.unrestrictedStock} uom={r.unrestrictedUOM} color="green" />
                  <StockCell value={r.qualityStock} uom={r.qualityUOM} color="yellow" />
                  <StockCell value={r.blockedStock} uom={r.blockedUOM} color="red" />
                  <StockCell value={r.totalStock} uom={r.totalUOM} color="indigo" bold />
                  <StockCell value={r.inTransitStock} uom={r.inTransitUOM} color="blue" />
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Location legend */}
        {allLocs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allLocs.map(loc => (
              <span key={loc} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-indigo-200 text-xs text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                {loc}: {locations[loc] ?? loc}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StockCell({ value, uom, color, bold }: { value: string; uom: string; color: string; bold?: boolean }) {
  const isZero = value === "0";
  const colorMap: Record<string, string> = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
    indigo: "text-indigo-800",
    blue: "text-blue-700",
  };
  return (
    <td className="px-3 py-2 border border-gray-200 text-right whitespace-nowrap">
      {isZero ? (
        <span className="text-gray-300">0 {uom}</span>
      ) : (
        <span className={`${colorMap[color]} ${bold ? "font-semibold" : ""}`}>
          {parseInt(value).toLocaleString()} {uom}
        </span>
      )}
    </td>
  );
}
