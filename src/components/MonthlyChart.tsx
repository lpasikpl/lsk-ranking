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

function formatLabel(val: number, metric: MonthlyChartProps["metric"]): string {
  switch (metric) {
    case "distance": return `${Math.round(val)}`;
    case "elevation": return `${Math.round(val)}`;
    case "time": return `${val.toFixed(1)}`;
    case "count": return `${Math.round(val)}`;
  }
}

export default function MonthlyChart({ data, year, metric: initialMetric }: MonthlyChartProps) {
  const [metric, setMetric] = useState(initialMetric);

  const fullYear: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.month === i + 1);
    return found || { month: i + 1, total_distance: 0, total_elevation: 0, total_time: 0, activity_count: 0 };
  });

  const values = fullYear.map(d => getValue(d, metric));
  const maxVal = Math.max(...values, 1);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const BAR_HEIGHT = 96;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Progresja miesięczna</h3>
          <p className="text-xs text-gray-600 mt-0.5">{year}</p>
        </div>
        <div className="flex gap-1">
          {(["distance", "elevation", "time", "count"] as const).map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${metric === m ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-gray-600 hover:text-gray-400"}`}>
              {m === "distance" ? "km" : m === "elevation" ? "m↑" : m === "time" ? "h" : "#"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 items-end">
        {fullYear.map((d, i) => {
          const val = values[i];
          const barPx = maxVal > 0 ? Math.max((val / maxVal) * BAR_HEIGHT, val > 0 ? 3 : 0) : 0;
          const isPast = year < currentYear || (year === currentYear && i < currentMonth);
          const isCurrent = year === currentYear && i === currentMonth;

          return (
            <div key={i} className="flex-1 flex flex-col items-center" style={{ height: `${BAR_HEIGHT + 36}px` }}>
              {/* etykieta */}
              <div className="flex-1 flex items-end justify-center pb-1">
                {val > 0 && (
                  <span className={`text-[10px] font-semibold leading-none ${isCurrent ? "text-orange-400" : "text-gray-500"}`}>
                    {formatLabel(val, metric)}
                  </span>
                )}
              </div>
              {/* słupek */}
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${barPx}px`,
                  flexShrink: 0,
                  background: isCurrent
                    ? "linear-gradient(to top, #fc4c02, #ff8c00)"
                    : isPast
                    ? "rgba(252, 76, 2, 0.45)"
                    : "rgba(255,255,255,0.05)",
                }}
              />
              {/* miesiąc */}
              <div className="h-5 flex items-center justify-center">
                <span className={`text-[10px] ${isCurrent ? "text-orange-400 font-semibold" : "text-gray-700"}`}>
                  {MONTHS[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
