// Zakładka Decoupling - EF, cardiac drift, wykres
"use client";
import EfChart from "@/components/analiza/charts/EfChart";
import AiCommentCard from "@/components/analiza/cards/AiCommentCard";

function efColor(drift: number | null): string {
  if (drift == null) return "#fff";
  const abs = Math.abs(drift);
  if (abs <= 5) return "#4CAF50";
  if (abs <= 10) return "#FFC107";
  return "#f44336";
}

interface DecouplingTabProps {
  laps: any[];
  aiComment: string | null;
}

export default function DecouplingTab({ laps, aiComment }: DecouplingTabProps) {
  // Oblicz EF per lap — NP preferowany, avg_power jako fallback
  const lapsWithEf = laps
    .filter(l => (l.normalized_power || l.avg_power) && l.avg_hr && l.avg_hr > 0)
    .map(l => {
      const power = l.normalized_power ?? l.avg_power;
      return { ...l, ef: power / l.avg_hr, usedNp: !!l.normalized_power };
    });

  if (lapsWithEf.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Brak danych do analizy decoupling (wymagane moc i HR per okrążenie)
      </div>
    );
  }

  const usingNp = lapsWithEf.some(l => l.usedNp);

  const half = Math.floor(lapsWithEf.length / 2);
  const avgEf = (arr: any[]) => arr.reduce((s, l) => s + l.ef, 0) / arr.length;

  const ef1 = avgEf(lapsWithEf.slice(0, half));
  const ef2 = avgEf(lapsWithEf.slice(half));
  const drift = ((ef2 - ef1) / ef1) * 100;

  const color = efColor(drift);

  return (
    <div className="space-y-6">
      {/* Karty EF */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `EF - 1. polowa (${usingNp ? "NP" : "AvgP"}/HR)`, value: ef1.toFixed(3) },
          { label: `EF - 2. polowa (${usingNp ? "NP" : "AvgP"}/HR)`, value: ef2.toFixed(3) },
          { label: "Cardiac drift", value: `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}%`, color },
        ].map(c => (
          <div
            key={c.label}
            className="rounded-xl p-4"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color ?? "#fff" }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Wykres EF */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
          Efficiency Factor per okrążenie
        </h3>
        <EfChart laps={laps} />
      </div>

      <AiCommentCard comment={aiComment} section="decoupling" />
    </div>
  );
}
