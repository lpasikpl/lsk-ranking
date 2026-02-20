"use client";

import { useState, useEffect, useRef } from "react";

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

// Oblicz Wielkanoc (algorytm anonimowy gregoriański)
function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Polskie święta dla danego roku/miesiąca → zbiór dni
function getPolishHolidays(year: number, month: number): Set<number> {
  const holidays = new Set<number>();
  const add = (m: number, d: number) => { if (m === month) holidays.add(d); };

  // Stałe
  add(1, 1);   // Nowy Rok
  add(1, 6);   // Trzech Króli
  add(5, 1);   // Święto Pracy
  add(5, 3);   // Konstytucja 3 Maja
  add(8, 15);  // Wniebowzięcie NMP
  add(11, 1);  // Wszystkich Świętych
  add(11, 11); // Święto Niepodległości
  add(12, 25); // Boże Narodzenie
  add(12, 26); // Drugi dzień BN

  // Ruchome - Wielkanoc
  const easter = getEaster(year);
  const easterMonth = easter.getMonth() + 1;
  const easterDay = easter.getDate();
  add(easterMonth, easterDay);                          // Niedziela Wielkanocna

  const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1);
  add(easterMonday.getMonth() + 1, easterMonday.getDate()); // Poniedziałek Wielkanocny

  const whitsun = new Date(easter); whitsun.setDate(easter.getDate() + 49);
  add(whitsun.getMonth() + 1, whitsun.getDate());       // Zesłanie Ducha Świętego

  const corpusChristi = new Date(easter); corpusChristi.setDate(easter.getDate() + 60);
  add(corpusChristi.getMonth() + 1, corpusChristi.getDate()); // Boże Ciało

  return holidays;
}

// 0=Niedziela, 6=Sobota
function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

const BAR_HEIGHT = 200;
const TOTAL_ANIM_MS = 1700;
const BAR_TRANSITION_MS = 320;

const MONTH_NAMES = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

export default function DailyChart({ data, year, month, daysInMonth }: DailyChartProps) {
  const [metric, setMetric] = useState<Metric>("distance");
  const [animated, setAnimated] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const today = now.getDate();

  const holidays = getPolishHolidays(year, month);

  const fullMonth: DailyData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const found = data.find(d => d.day === i + 1);
    return found || { day: i + 1, total_distance: 0, total_elevation: 0, total_time: 0, activity_count: 0 };
  });

  const values = fullMonth.map(d => getValue(d, metric));
  const maxVal = Math.max(...values, 1);
  const delayPerBar = daysInMonth > 1 ? (TOTAL_ANIM_MS - BAR_TRANSITION_MS) / (daysInMonth - 1) : 0;

  return (
    <div ref={ref} className="glass rounded-2xl p-6">
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
          const barPx = maxVal > 0 ? Math.max((val / maxVal) * BAR_HEIGHT, val > 0 ? 4 : 0) : 0;
          const isFuture = isCurrentMonth && d.day > today;
          const isToday = isCurrentMonth && d.day === today;
          const hasActivity = val > 0;

          const dow = getDayOfWeek(year, month, d.day);
          const isSunday = dow === 0;
          const isSaturday = dow === 6;
          const isHoliday = holidays.has(d.day);
          const isRed = isSunday || isHoliday;

          // Kolor słupka
          let barBg: string;
          if (isToday) {
            barBg = "linear-gradient(to top, #fc4c02, #ff8c00)";
          } else if (isFuture) {
            barBg = "rgba(255,255,255,0.04)";
          } else if (!hasActivity) {
            barBg = "rgba(255,255,255,0.03)";
          } else {
            barBg = "rgba(252, 76, 2, 0.65)";
          }

          // Kolor etykiety dnia
          const dayLabelColor = isToday
            ? "text-orange-400 font-bold"
            : isRed
            ? "text-red-400 font-semibold"
            : isSaturday
            ? "text-indigo-400 font-semibold"
            : "text-gray-600";

          const isHovered = hoveredIdx === i;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center relative"
              style={{ height: `${BAR_HEIGHT + 36}px` }}
              onMouseEnter={() => hasActivity && setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* tooltip */}
              {isHovered && hasActivity && (
                <div className="absolute bottom-full mb-1 z-10 pointer-events-none"
                  style={{ left: "50%", transform: "translateX(-50%)" }}>
                  <div className="bg-gray-900 border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                    <span className={`text-[11px] font-bold ${isToday ? "text-orange-400" : "text-white/90"}`}>
                      {formatLabel(val, metric)}
                    </span>
                  </div>
                </div>
              )}
              {/* spacer */}
              <div className="flex-1" />
              {/* słupek */}
              <div
                className="w-full rounded-t cursor-pointer"
                style={{
                  height: animated ? `${barPx}px` : "0px",
                  transition: `height ${BAR_TRANSITION_MS}ms ease`,
                  transitionDelay: animated ? `${i * delayPerBar}ms` : "0ms",
                  background: isHovered && hasActivity
                    ? isToday ? "linear-gradient(to top, #fc4c02, #ff8c00)" : "rgba(252, 76, 2, 0.9)"
                    : barBg,
                  flexShrink: 0,
                }}
              />
              {/* numer dnia */}
              <div className="h-5 flex items-center justify-center">
                <span className={`text-[9px] leading-none ${dayLabelColor}`}>
                  {d.day}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm text-indigo-400 border border-indigo-400/60 flex items-center justify-center">
            <span className="text-[6px] font-bold leading-none">so</span>
          </div>
          <span className="text-[10px] text-gray-600">Sobota</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm text-red-400 border border-red-400/60 flex items-center justify-center">
            <span className="text-[6px] font-bold leading-none">św</span>
          </div>
          <span className="text-[10px] text-gray-600">Niedziela / święto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(to top, #fc4c02, #ff8c00)" }} />
          <span className="text-[10px] text-gray-600">Dziś</span>
        </div>
      </div>
    </div>
  );
}
