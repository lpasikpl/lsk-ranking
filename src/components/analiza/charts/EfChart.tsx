// Wykres EF per okrążenie z NP i HR
"use client";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

interface Lap {
  lap_number: number;
  normalized_power: number | null;
  avg_power: number | null;
  avg_hr: number | null;
}

interface EfChartProps {
  laps: Lap[];
  ftp?: number;
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 },
  itemStyle: { color: "#ccc" },
  labelStyle: { color: "#ccc" },
};

export default function EfChart({ laps }: EfChartProps) {
  // NP preferowane, avg_power jako fallback gdy NP brak
  const data = laps
    .filter(l => (l.normalized_power || l.avg_power) && l.avg_hr && l.avg_hr > 0)
    .map(l => {
      const power = l.normalized_power ?? l.avg_power!;
      return {
        lap: `Ok. ${l.lap_number}`,
        np: power,
        avgHr: l.avg_hr,
        ef: Math.round((power / l.avg_hr!) * 1000) / 1000,
      };
    });

  if (data.length === 0) return (
    <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
      Brak danych do wykresu EF
    </p>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="lap" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="power" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="ef" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto","auto"]} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar yAxisId="power" dataKey="np" name="Moc (W)" fill="#2196F3" opacity={0.5} />
        <Line yAxisId="power" type="monotone" dataKey="avgHr" name="Avg HR" stroke="#f44336" strokeWidth={2} dot={false} />
        <Line yAxisId="ef" type="monotone" dataKey="ef" name="EF" stroke="#4CAF50" strokeWidth={3} dot={{ r: 4, fill: "#4CAF50" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
