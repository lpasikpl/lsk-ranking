"use client";

import { useState } from "react";

interface MonthlyData {
  month: number;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  activity_count: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  year: number;
  metric: "distance" | "elevation" | "time" | "count";
}

const MONTHS = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

function getValue(d: MonthlyData, metric: MonthlyChartProps["metric"]): number {
  switch (metric) {
    case "distance": return d.total_distance / 1000;
    case "elevation": return d.total_elevation;
    case "time": return d.total_time / 3600;
    case "count": return d.activity_count;
  }
}

function formatTooltip(val: number, metric: MonthlyChartProps["metric"]): string {
  switch (metric) {
    case "distance": return `${Math.round(val)} km`;
    case "elevation": return `${Math.round(val)} m`;
    case "time": {
      const h = Math.floor(val);
      const m = Math.round((val - h) * 60);
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
    }
    case "count": return `${Math.round(val)}`;
  }
}

function getNiceTicks(maxVal: number, count = 4): number[] {
  if (maxVal <= 0) return [];
  const rough = maxVal / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const ticks: number[] = [];
  for (let v = step; v <= maxVal * 1.05 && ticks.length < count; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function formatAxisLabel(val: number, metric: MonthlyChartProps["metric"]): string {
  if (metric === "time") {
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    if (h > 0 && m > 0) return `${h}h${m}`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
  return String(Math.round(val));
}

const BAR_HEIGHT = 200;

export default function MonthlyChart({ data, year, metric: initialMetric }: MonthlyChartProps) {
  const [metric, setMetric] = useState(initialMetric);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const fullYear: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.month === i + 1);
    return found || { month: i + 1, total_distance: 0, total_elevation: 0, total_time: 0, activity_count: 0 };
  });

  const values = fullYear.map(d => getValue(d, metric));
  const maxVal = Math.max(...values, 1);
  const ticks = getNiceTicks(maxVal);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {(["distance", "elevation", "time", "count"] as const).map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${metric === m ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-gray-600 hover:text-gray-400"}`}>
              {m === "distance" ? "km" : m === "elevation" ? "m↑" : m === "time" ? "h" : "#"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {/* Oś Y */}
        <div className="relative flex-shrink-0 w-7" style={{ height: `${BAR_HEIGHT + 24}px` }}>
          {ticks.map(tick => {
            const yPct = (1 - tick / maxVal) * BAR_HEIGHT;
            return (
              <span
                key={tick}
                className="absolute right-0 text-[9px] text-gray-600 leading-none -translate-y-1/2"
                style={{ top: `${yPct}px` }}
              >
                {formatAxisLabel(tick, metric)}
              </span>
            );
          })}
        </div>

        {/* Obszar wykresu */}
        <div className="flex-1 relative">
          {/* Linie siatki */}
          {ticks.map(tick => {
            const fromBottom = (tick / maxVal) * BAR_HEIGHT + 24;
            return (
              <div
                key={tick}
                className="absolute left-0 right-0 pointer-events-none"
                style={{ bottom: `${fromBottom}px`, borderTop: "1px solid rgba(255,255,255,0.06)" }}
              />
            );
          })}

          {/* Słupki */}
          <div className="flex gap-1.5 items-end">
            {fullYear.map((_d, i) => {
              const val = values[i];
              const barPx = maxVal > 0 ? Math.max((val / maxVal) * BAR_HEIGHT, val > 0 ? 3 : 0) : 0;
              const isPast = year < currentYear || (year === currentYear && i < currentMonth);
              const isCurrent = year === currentYear && i === currentMonth;
              const hasActivity = val > 0;
              const isHovered = hoveredIdx === i;

              const barBg = isCurrent
                ? "linear-gradient(to top, #fc4c02, #ff8c00)"
                : isPast && hasActivity
                ? "rgba(252, 76, 2, 0.65)"
                : "rgba(255,255,255,0.05)";

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center relative"
                  style={{ height: `${BAR_HEIGHT + 24}px` }}
                  onMouseEnter={() => hasActivity && setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* tooltip */}
                  {isHovered && hasActivity && (
                    <div className="absolute bottom-full mb-1 z-10 pointer-events-none"
                      style={{ left: "50%", transform: "translateX(-50%)" }}>
                      <div className="bg-gray-900 border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                        <span className={`text-[11px] font-bold ${isCurrent ? "text-orange-400" : "text-white/90"}`}>
                          {formatTooltip(val, metric)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex-1" />
                  {/* słupek */}
                  <div
                    className="w-full rounded-t cursor-pointer transition-all duration-300"
                    style={{
                      height: `${barPx}px`,
                      flexShrink: 0,
                      background: isHovered && hasActivity
                        ? isCurrent ? "linear-gradient(to top, #fc4c02, #ff8c00)" : "rgba(252, 76, 2, 0.9)"
                        : barBg,
                    }}
                  />
                  {/* miesiąc */}
                  <div className="h-6 flex items-center justify-center">
                    <span className={`text-xs font-medium ${isCurrent ? "text-orange-400 font-bold" : "text-gray-500"}`}>
                      {MONTHS[i]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
