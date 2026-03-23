// Zakładka Pedałowanie - TE i PS
"use client";
import AiCommentCard from "@/components/analiza/cards/AiCommentCard";
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 },
  itemStyle: { color: "#ccc" },
  labelStyle: { color: "#ccc" },
};

interface Record {
  seconds_offset: number;
  left_torque_effectiveness: number | null;
  left_pedal_smoothness: number | null;
}

interface PedalingTabProps {
  records: Record[];
  fitData: any | null;
  aiComment: string | null;
}

export default function PedalingTab({ records, fitData, aiComment }: PedalingTabProps) {
  const withPedaling = records.filter(r => r.left_torque_effectiveness != null);

  if (withPedaling.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Brak danych pedałowania w tym treningu (wymagany Garmin Vector/Rally)
      </div>
    );
  }

  const half = Math.floor(withPedaling.length / 2);
  const avg = (arr: Record[], key: keyof Record) => {
    const vals = arr.map(r => r[key] as number).filter(v => v != null);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  };

  const te1 = avg(withPedaling.slice(0, half), "left_torque_effectiveness");
  const te2 = avg(withPedaling.slice(half), "left_torque_effectiveness");
  const ps1 = avg(withPedaling.slice(0, half), "left_pedal_smoothness");
  const ps2 = avg(withPedaling.slice(half), "left_pedal_smoothness");

  // Timeline - próbkuj co 5 punktów
  const timelineData = withPedaling
    .filter((_, i) => i % 5 === 0)
    .map(r => ({
      t: Math.round(r.seconds_offset / 60),
      te: r.left_torque_effectiveness,
      ps: r.left_pedal_smoothness,
    }));

  return (
    <div className="space-y-6">
      {/* Karty TE/PS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "TE - 1. polowa", value: te1, unit: "%" },
          { label: "TE - 2. polowa", value: te2, unit: "%" },
          { label: "PS - 1. polowa", value: ps1, unit: "%" },
          { label: "PS - 2. polowa", value: ps2, unit: "%" },
        ].map(c => (
          <div
            key={c.label}
            className="rounded-xl p-4"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: "#fff" }}>
              {c.value != null ? `${c.value}${c.unit}` : "-"}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline TE + PS */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
          TE i PS w czasie
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="t" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} unit="min" />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={v => `${v} min`} />
            <Area type="monotone" dataKey="te" name="TE (%)" stroke="#2196F3" fill="#2196F3" fillOpacity={0.3} dot={false} />
            <Area type="monotone" dataKey="ps" name="PS (%)" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <AiCommentCard comment={aiComment} section="pedaling" />
    </div>
  );
}
