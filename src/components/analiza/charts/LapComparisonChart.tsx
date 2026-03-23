// Wykres porownania okrazen: słupki avgPower + linia NP + linia avgHR
"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface Lap {
  lap_number: number;
  avg_power: number | null;
  normalized_power: number | null;
  avg_hr: number | null;
}

interface LapComparisonChartProps {
  laps: Lap[];
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 },
  itemStyle: { color: "#ccc" },
  labelStyle: { color: "#ccc" },
};

export default function LapComparisonChart({ laps }: LapComparisonChartProps) {
  if (laps.length === 0) return null;

  const data = laps.map(l => ({
    lap: `Ok. ${l.lap_number}`,
    avgPower: l.avg_power,
    np: l.normalized_power,
    avgHr: l.avg_hr,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="lap" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="power" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="hr" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
        <Bar yAxisId="power" dataKey="avgPower" name="Avg Power (W)" fill="#2196F3" opacity={0.7} />
        <Line yAxisId="power" type="monotone" dataKey="np" name="NP (W)" stroke="#FF9800" strokeWidth={2} dot={false} />
        <Line yAxisId="hr" type="monotone" dataKey="avgHr" name="Avg HR (bpm)" stroke="#f44336" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
