// Kolorowy pasek proporcjonalny stref mocy (Coggan)
"use client";

const ZONE_COLORS = ["#8B8B8B","#2196F3","#4CAF50","#FFC107","#FF9800","#f44336","#9C27B0"];
const ZONE_LABELS = ["Z1","Z2","Z3","Z4","Z5","Z6","Z7"];

interface PowerZonesBarProps {
  zoneSecs: number[];
  showLegend?: boolean;
}

export default function PowerZonesBar({ zoneSecs, showLegend = true }: PowerZonesBarProps) {
  const total = zoneSecs.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const pcts = zoneSecs.map(s => (s / total) * 100);

  const fmtTime = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  return (
    <div>
      {/* Pasek proporcjonalny */}
      <div className="flex rounded-lg overflow-hidden h-5" style={{ gap: 1 }}>
        {pcts.map((pct, i) =>
          pct > 0.5 ? (
            <div
              key={i}
              title={`${ZONE_LABELS[i]}: ${fmtTime(zoneSecs[i])} (${pct.toFixed(1)}%)`}
              style={{ width: `${pct}%`, background: ZONE_COLORS[i], minWidth: 2 }}
            />
          ) : null
        )}
      </div>

      {/* Legenda */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {zoneSecs.map((s, i) =>
            s > 0 ? (
              <div key={i} className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                <div className="w-2 h-2 rounded-sm" style={{ background: ZONE_COLORS[i] }} />
                <span>{ZONE_LABELS[i]}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{fmtTime(s)}</span>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
