export function KpiCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  valueColor: string;
}) {
  return (
    <div
      className="rounded-xl p-4 bg-white flex items-start gap-3"
      style={{ border: "1px solid #e2e8f0" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="font-bold uppercase tracking-wide mb-0.5"
          style={{ color: "#94a3b8", fontSize: 9 }}
        >
          {label}
        </p>
        <p
          className="font-bold truncate"
          style={{ color: valueColor, fontSize: 16 }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
