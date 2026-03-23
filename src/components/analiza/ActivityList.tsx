// Tabela aktywnosci dla /analiza
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtDist(m: number): string {
  return (m / 1000).toFixed(1);
}

interface Activity {
  id: number;
  name: string;
  start_date: string;
  distance_meters: number;
  moving_time_seconds: number;
  average_watts: number | null;
  weighted_average_watts: number | null;
  normalized_power: number | null;
  tss: number | null;
  effective_tss: number | null;
  intensity_factor: number | null;
  average_heartrate: number | null;
  has_fit_analysis: boolean;
  ai_comments: Array<{ section: string }>;
  fit_activities: any[] | null;
}

interface Props {
  from?: string;
  to?: string;
}

export default function ActivityList({ from, to }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/analiza/activities?${params}`)
      .then(r => r.json())
      .then(d => { setActivities(d.activities ?? []); setLoading(false); });
  }, [from, to]);

  const handleProcessFit = async (id: number) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/activities/${id}/process-fit`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        // Odswierz listę
        const params = new URLSearchParams({ limit: "100" });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const r = await fetch(`/api/analiza/activities?${params}`);
        const d = await r.json();
        setActivities(d.activities ?? []);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Ladowanie aktywnosci...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Brak aktywnosci w wybranym okresie
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {["Data","Nazwa","Dystans","Czas","Avg W","NP","TSS","IF","HR","Status"].map(h => (
              <th key={h} className="text-left py-2 px-2 text-xs uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activities.map(a => {
            const hasFit = a.has_fit_analysis;
            const hasAi = a.ai_comments?.length > 0;
            const np = a.weighted_average_watts ?? a.normalized_power;
            const tss = a.effective_tss ?? a.tss;

            return (
              <tr
                key={a.id}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 px-2 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {fmtDate(a.start_date)}
                </td>
                <td className="py-2.5 px-2 max-w-[200px]">
                  <Link href={`/analiza/${a.id}`} className="hover:text-orange-400 transition-colors" style={{ color: "#fff" }}>
                    {a.name}
                  </Link>
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {fmtDist(a.distance_meters)} km
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {fmtTime(a.moving_time_seconds)}
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {a.average_watts ? Math.round(a.average_watts) : "-"}
                </td>
                <td className="py-2.5 px-2 font-semibold" style={{ color: "#f97316" }}>
                  {np ? Math.round(np) : "-"}
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {tss ? Math.round(tss) : "-"}
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {a.intensity_factor?.toFixed(2) ?? "-"}
                </td>
                <td className="py-2.5 px-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {a.average_heartrate ? Math.round(a.average_heartrate) : "-"}
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-1.5">
                    {hasFit ? (
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                        FIT
                      </span>
                    ) : (
                      <button
                        onClick={() => handleProcessFit(a.id)}
                        disabled={processingId === a.id}
                        className="px-1.5 py-0.5 rounded text-xs transition-opacity"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}
                      >
                        {processingId === a.id ? "..." : "Analizuj FIT"}
                      </button>
                    )}
                    {hasAi && (
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                        AI
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
