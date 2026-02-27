"use client";

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { TrainingLoadDay } from "@/lib/strava-types";

interface TrainingLoadChartProps {
  data: TrainingLoadDay[];
}

export function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        CTL / ATL / TSB — ostatnie 90 dni
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="gradTsb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="50%" stopColor="#22c55e" stopOpacity={0} />
              <stop offset="50%" stopColor="#ef4444" stopOpacity={0} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
            labelFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
          />
          <Area
            type="monotone"
            dataKey="tsb"
            stroke="transparent"
            fill="url(#gradTsb)"
            name="TSB (forma)"
          />
          <Line type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2} dot={false} name="CTL (fitness)" />
          <Line type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2} dot={false} name="ATL (zmęczenie)" />
          <Line type="monotone" dataKey="tsb" stroke="#22c55e" strokeWidth={2} dot={false} name="TSB (forma)" />
        </ComposedChart>
      </ResponsiveContainer>
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
    </div>
  );
}
