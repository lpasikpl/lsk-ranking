"use client";

import { useState } from "react";

interface DailyData {
  day: number;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  activity_count: number;
}

interface DailyChartProps {
  data: DailyData[];
  year: number;
  month: number;
  daysInMonth: number;
}

type Metric = "distance" | "elevation" | "time" | "count";

function getValue(d: DailyData, metric: Metric): number {
  switch (metric) {
    case "distance": return d.total_distance / 1000;
    case "elevation": return d.total_elevation;
    case "time": return d.total_time / 3600;
    case "count": return d.activity_count;
  }
}

function formatLabel(val: number, metric: Metric): string {
  switch (metric) {
    case "distance": return `${Math.round(val)}`;
    case "elevation": return `${Math.round(val)}`;
    case "time": return `${val.toFixed(1)}`;
    case "count": return `${Math.round(val)}`;
  }
}

const BAR_HEIGHT = 88; // px - wysokość obszaru słupków

const MONTH_NAMES = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

export default function DailyChart({ data, year, month, daysInMonth }: DailyChartProps) {
  const [metric, setMetric] = useState<Metric>("distance");

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const today = now.getDate();

  const fullMonth: DailyData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const found = data.find(d => d.day === i + 1);
    return found || { day: i + 1, total_distance: 0, total_elevation: 0, total_time: 0, activity_count: 0 };
  });

  const values = fullMonth.map(d => getValue(d, metric));
  const maxVal = Math.max(...values, 1);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Aktywność dzienna</h3>
          <p className="text-xs text-gray-600 mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
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

      <div className="flex gap-0.5 items-end">
        {fullMonth.map((d, i) => {
          const val = values[i];
          const barPx = maxVal > 0 ? Math.max((val / maxVal) * BAR_HEIGHT, val > 0 ? 3 : 0) : 0;
          const isFuture = isCurrentMonth && d.day > today;
          const isToday = isCurrentMonth && d.day === today;
          const hasActivity = val > 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center" style={{ height: `${BAR_HEIGHT + 32}px` }}>
              {/* etykieta wartości */}
              <div className="flex-1 flex items-end justify-center pb-0.5">
                {hasActivity && (
                  <span className={`text-[8px] font-semibold leading-none ${isToday ? "text-orange-400" : "text-gray-500"}`}>
                    {formatLabel(val, metric)}
                  </span>
                )}
              </div>
              {/* słupek */}
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${barPx}px`,
                  background: isToday
                    ? "linear-gradient(to top, #fc4c02, #ff8c00)"
                    : isFuture
                    ? "rgba(255,255,255,0.04)"
                    : hasActivity
                    ? "rgba(252, 76, 2, 0.45)"
                    : "rgba(255,255,255,0.03)",
                  flexShrink: 0,
                }}
              />
              {/* dzień */}
              <div className="h-4 flex items-center justify-center">
                <span className={`text-[8px] ${isToday ? "text-orange-400 font-semibold" : "text-gray-700"}`}>
                  {d.day % 5 === 0 || d.day === 1 ? d.day : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
