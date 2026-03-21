"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { TrainingLoadDay } from "@/lib/strava-types";

interface TrainingLoadChartProps {
  data: TrainingLoadDay[];
}

function ChartContent({ data, gradientId, height }: { data: TrainingLoadDay[]; gradientId: string; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="50%" stopColor="#22c55e" stopOpacity={0} />
            <stop offset="50%" stopColor="#ef4444" stopOpacity={0} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          tickFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f1117",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          }}
          labelFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
        />
        <Area
          type="monotone"
          dataKey="tsb"
          stroke="transparent"
          fill={`url(#${gradientId})`}
          name="TSB (forma)"
        />
        <Line type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2} dot={false} name="CTL (fitness)" />
        <Line type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2} dot={false} name="ATL (zmęczenie)" />
        <Line type="monotone" dataKey="tsb" stroke="#22c55e" strokeWidth={2} dot={false} name="TSB (forma)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-6 mt-3 text-xs text-[var(--text-muted)]">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-[#3b82f6] rounded" /> CTL (fitness)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-[#ef4444] rounded" /> ATL (zmęczenie)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-0.5 bg-[#22c55e] rounded" /> TSB (forma)
      </span>
    </div>
  );
}

export function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded, close]);

  return (
    <>
      <div
        className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 cursor-pointer transition-opacity hover:opacity-90"
        onClick={() => setExpanded(true)}
        title="Kliknij, aby powiększyć"
      >
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          CTL / ATL / TSB — ostatnie 90 dni
        </h2>
        <ChartContent data={data} gradientId="gradTsb" height={280} />
        <Legend />
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-[95vw] max-w-[1400px] rounded-2xl bg-[#0f1117] border border-[rgba(255,255,255,0.15)] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors text-2xl leading-none"
            >
              &times;
            </button>
            <h2 className="text-base font-medium text-white/80 mb-6">
              CTL / ATL / TSB — ostatnie 90 dni
            </h2>
            <ChartContent data={data} gradientId="gradTsbExpanded" height={500} />
            <Legend />
          </div>
        </div>
      )}
    </>
  );
}
