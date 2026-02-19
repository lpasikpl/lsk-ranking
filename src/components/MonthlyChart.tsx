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

function formatValue(val: number, metric: MonthlyChartProps["metric"]): string {
  switch (metric) {
    case "distance": return `${val.toFixed(0)} km`;
    case "elevation": return `${Math.round(val)} m`;
    case "time": return `${val.toFixed(1)} h`;
    case "count": return `${Math.round(val)} aktywności`;
  }
}

export default function MonthlyChart({ data, year, metric: initialMetric }: MonthlyChartProps) {
  const [metric, setMetric] = useState(initialMetric);
  // Wypełnij brakujące miesiące zerami
  const fullYear: MonthlyData[] = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.month === i + 1);
    return found || { month: i + 1, total_distance: 0, total_elevation: 0, total_time: 0, activity_count: 0 };
  });

  const values = fullYear.map(d => getValue(d, metric));
  const maxVal = Math.max(...values, 1);
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Progresja miesięczna</h3>
          <p className="text-xs text-gray-600 mt-0.5">{year}</p>
        </div>
        <div className="flex gap-1">
          {(["distance", "elevation", "time", "count"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                metric === m
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {m === "distance" ? "km" : m === "elevation" ? "m↑" : m === "time" ? "h" : "#"}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-32">
        {fullYear.map((d, i) => {
          const val = values[i];
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isPast = year < currentYear || (year === currentYear && i < currentMonth);
          const isCurrent = year === currentYear && i === currentMonth;
          const isFuture = year === currentYear && i > currentMonth;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="w-full flex flex-col justify-end h-24 relative">
                {val > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatValue(val, metric)}
                  </div>
                )}
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(heightPct, val > 0 ? 2 : 0)}%`,
                    background: isCurrent
                      ? "linear-gradient(to top, #fc4c02, #ff8c00)"
                      : isPast
                      ? "rgba(252, 76, 2, 0.4)"
                      : isFuture
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(252, 76, 2, 0.4)",
                  }}
                />
              </div>
              <span className={`text-xs ${isCurrent ? "text-orange-400 font-semibold" : "text-gray-700"}`}>
                {MONTHS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
