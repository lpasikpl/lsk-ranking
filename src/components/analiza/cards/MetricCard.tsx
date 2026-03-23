// Karta metryczna dla dashboardu analitycznego
interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  unit?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, subtitle, unit, highlight }: MetricCardProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-2xl font-bold"
          style={{ color: highlight ? "#f97316" : "#fff" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {unit}
          </span>
        )}
      </div>
      {subtitle && (
        <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
