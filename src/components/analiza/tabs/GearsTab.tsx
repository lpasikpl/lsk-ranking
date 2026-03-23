// Zakładka Przerzutki - matryca uzycia przekładni
"use client";
import AiCommentCard from "@/components/analiza/cards/AiCommentCard";

const ZONE_COLORS = ["#8B8B8B","#2196F3","#4CAF50","#FFC107","#FF9800","#f44336","#9C27B0"];

function getPowerZone(power: number | null, ftp: number): number {
  if (!power) return 0;
  const p = power / ftp;
  if (p < 0.55) return 0;
  if (p < 0.75) return 1;
  if (p < 0.90) return 2;
  if (p < 1.05) return 3;
  if (p < 1.20) return 4;
  if (p < 1.50) return 5;
  return 6;
}

function fmtTime(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec > 0 ? sec + "s" : ""}`.trim();
}

interface GearEvent {
  seconds_offset: number;
  front_gear: number | null;
  rear_gear: number | null;
  power_at_change: number | null;
  speed_at_change: number | null;
}

interface GearsTabProps {
  gearEvents: GearEvent[];
  totalSeconds: number;
  ftp: number;
  aiComment: string | null;
}

export default function GearsTab({ gearEvents, totalSeconds, ftp, aiComment }: GearsTabProps) {
  if (gearEvents.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Brak danych przerzutek w tym treningu
      </div>
    );
  }

  // Oblicz czas per kombinacja
  const gearMap: Record<string, { seconds: number; powers: number[] }> = {};
  for (let i = 0; i < gearEvents.length; i++) {
    const evt = gearEvents[i];
    const next = gearEvents[i + 1];
    const dur = next ? next.seconds_offset - evt.seconds_offset : totalSeconds - evt.seconds_offset;
    if (dur <= 0) continue;
    const combo = `${evt.front_gear}/${evt.rear_gear}`;
    if (!gearMap[combo]) gearMap[combo] = { seconds: 0, powers: [] };
    gearMap[combo].seconds += dur;
    if (evt.power_at_change) gearMap[combo].powers.push(evt.power_at_change);
  }

  const combos = Object.entries(gearMap)
    .map(([combo, { seconds, powers }]) => ({
      combo,
      seconds,
      pct: (seconds / totalSeconds) * 100,
      avgPower: powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : null,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  return (
    <div className="space-y-6">
      {/* Matryca uzycia */}
      <div
        className="rounded-xl p-4"
        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          Uzycie przełożeń
        </h3>
        <div className="space-y-2">
          {combos.map(c => {
            const zone = getPowerZone(c.avgPower, ftp);
            const color = c.avgPower ? ZONE_COLORS[zone] : "#555";
            return (
              <div key={c.combo} className="flex items-center gap-3">
                <div className="w-14 text-xs font-mono text-right" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {c.combo}
                </div>
                <div className="flex-1 relative h-6 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded"
                    style={{ width: `${c.pct}%`, background: color, opacity: 0.7 }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 text-xs font-semibold" style={{ color: "#fff" }}>
                    {fmtTime(c.seconds)} ({c.pct.toFixed(1)}%)
                    {c.avgPower && <span className="ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>{c.avgPower}W</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AiCommentCard comment={aiComment} section="gears" />
    </div>
  );
}
