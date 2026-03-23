"use client";
import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ComposedChart, Area, ReferenceLine, Legend,
} from "recharts";
import type { Activity, TrainingLoadDay, WeeklySummary } from "@/lib/strava-types";

// ─── stałe ────────────────────────────────────────────────────────────────────
const ZC = ["#8B8B8B", "#2196F3", "#4CAF50", "#FFC107", "#FF9800", "#f44336", "#9C27B0"];
const MONTH_PL = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", fontSize: 12 },
  itemStyle: { color: "rgba(255,255,255,0.8)" },
  labelStyle: { color: "rgba(255,255,255,0.5)" },
};
const CARD_STYLE = { background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" };
const TABS = ["📊 Podsumowanie", "⚡ Moc & Tętno", "💪 Forma", "📈 Sezon", "📋 Treningi"];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH_PL[dt.getMonth()]}`;
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// ─── typy ─────────────────────────────────────────────────────────────────────
interface Props {
  activities2026: Activity[];
  activities2025: Activity[];
  trainingLoad: TrainingLoadDay[];
  weeklySummaries: WeeklySummary[];
}

interface TabProps extends Props {
  monthly2026: MonthRow[];
  monthly2025: MonthRow[];
  weeklyFromActs: WeekRow[];
}

interface MonthRow {
  month: number;
  label: string;
  km: number;
  rides: number;
  hours: number;
  elevation: number;
  avgNp: number | null;
  avgHr: number | null;
  totalTss: number;
}

interface WeekRow {
  weekLabel: string;
  weekStart: string;
  km: number;
  rides: number;
  avgNp: number | null;
  avgHr: number | null;
  npHr: number | null;
  tss: number;
}

// ─── pomocnicze funkcje agregacji ─────────────────────────────────────────────
function buildMonthly(acts: Activity[]): MonthRow[] {
  const map = new Map<number, MonthRow>();
  for (let m = 1; m <= 12; m++) {
    map.set(m, { month: m, label: MONTH_PL[m - 1], km: 0, rides: 0, hours: 0, elevation: 0, avgNp: null, avgHr: null, totalTss: 0 });
  }
  const npAcc = new Map<number, number[]>();
  const hrAcc = new Map<number, number[]>();

  for (const a of acts) {
    const m = new Date(a.start_date).getMonth() + 1;
    const row = map.get(m)!;
    row.km += a.distance_meters / 1000;
    row.rides += 1;
    row.hours += a.moving_time_seconds / 3600;
    row.elevation += a.total_elevation_gain;
    row.totalTss += a.effective_tss ?? 0;
    if (a.has_power_data && a.normalized_power) {
      if (!npAcc.has(m)) npAcc.set(m, []);
      npAcc.get(m)!.push(a.normalized_power);
    }
    if (a.average_heartrate && a.average_heartrate > 0) {
      if (!hrAcc.has(m)) hrAcc.set(m, []);
      hrAcc.get(m)!.push(a.average_heartrate);
    }
  }

  for (const [m, row] of map) {
    const nps = npAcc.get(m);
    const hrs = hrAcc.get(m);
    row.avgNp = nps ? round0(avg(nps)) : null;
    row.avgHr = hrs ? round0(avg(hrs)) : null;
    row.km = round1(row.km);
    row.hours = round1(row.hours);
    row.elevation = round0(row.elevation);
    row.totalTss = round0(row.totalTss);
  }

  return Array.from(map.values());
}

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function buildWeekly(acts: Activity[]): WeekRow[] {
  const map = new Map<string, { acts: Activity[] }>();
  for (const a of acts) {
    const ws = getMonday(new Date(a.start_date));
    if (!map.has(ws)) map.set(ws, { acts: [] });
    map.get(ws)!.acts.push(a);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ws, { acts }]) => {
      const nps = acts.filter((a) => a.has_power_data && a.normalized_power).map((a) => a.normalized_power!);
      const hrs = acts.filter((a) => a.average_heartrate && a.average_heartrate > 0).map((a) => a.average_heartrate!);
      const avgNp = nps.length ? round0(avg(nps)) : null;
      const avgHr = hrs.length ? round0(avg(hrs)) : null;
      const npHr = avgNp && avgHr && avgHr > 0 ? Math.round((avgNp / avgHr) * 100) / 100 : null;
      const dt = new Date(ws + "T00:00:00");
      return {
        weekLabel: `${dt.getDate()} ${MONTH_PL[dt.getMonth()]}`,
        weekStart: ws,
        km: round1(acts.reduce((s, a) => s + a.distance_meters / 1000, 0)),
        rides: acts.length,
        avgNp,
        avgHr,
        npHr,
        tss: round0(acts.reduce((s, a) => s + (a.effective_tss ?? 0), 0)),
      };
    });
}

// ─── Tab 1: Podsumowanie ──────────────────────────────────────────────────────
function SummaryTab({ activities2026, activities2025, monthly2026, monthly2025, weeklySummaries }: TabProps) {
  const km26 = round1(activities2026.reduce((s, a) => s + a.distance_meters / 1000, 0));
  const km25 = round1(activities2025.reduce((s, a) => s + a.distance_meters / 1000, 0));
  const hours26 = round1(activities2026.reduce((s, a) => s + a.moving_time_seconds / 3600, 0));
  const elev26 = round0(activities2026.reduce((s, a) => s + a.total_elevation_gain, 0));
  const nps26 = activities2026.filter((a) => a.has_power_data && a.normalized_power).map((a) => a.normalized_power!);
  const avgNp = nps26.length ? round0(avg(nps26)) : null;
  const tss26 = round0(activities2026.reduce((s, a) => s + (a.effective_tss ?? 0), 0));

  const monthlyChart = monthly2026.map((m26) => {
    const m25 = monthly2025.find((x) => x.month === m26.month);
    return { label: m26.label, "2026": round1(m26.km), "2025": round1(m25?.km ?? 0) };
  });

  // Weekly TSS – last 26 weeks from weeklySummaries
  const recent = weeklySummaries.slice(-26);
  const avgTss = avg(recent.filter((w) => w.total_tss > 0).map((w) => w.total_tss));

  const cards = [
    { l: "Km 2026", v: `${km26} km`, sub: `${activities2026.length} jazd` },
    { l: "Km 2025 (ten sam okres)", v: `${km25} km`, sub: `${activities2025.length} jazd`, dim: true },
    { l: "Godziny 2026", v: `${hours26}h`, sub: `${round1(km26 / Math.max(activities2026.length, 1))} km/jazda śr.` },
    { l: "Przewyższenie 2026", v: `${elev26} m`, sub: `${round0(elev26 / Math.max(km26, 1))} m/100km` },
    { l: "Śr. NP (>10 km)", v: avgNp ? `${avgNp} W` : "—", sub: nps26.length > 0 ? `${nps26.length} jazd z mocą` : "brak danych" },
    { l: "TSS 2026", v: `${tss26}`, sub: `${round0(tss26 / Math.max(activities2026.length, 1))} TSS/jazda śr.` },
  ];

  return (
    <div>
      {/* Karty statystyk */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ ...CARD_STYLE, opacity: c.dim ? 0.65 : 1 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 4 }}>{c.l}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#fff" }}>{c.v}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Miesięczne km */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 8 }}>Kilometry miesięcznie — 2026 vs 2025</div>
      <div style={{ height: 200, marginBottom: 24 }}>
        <ResponsiveContainer>
          <BarChart data={monthlyChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} unit=" km" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v} km`]} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Bar dataKey="2026" fill="#2196F3" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="2025" fill="#888" radius={[4, 4, 0, 0]} opacity={0.4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tygodniowy TSS */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 4 }}>TSS tygodniowy (26 tygodni)</div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Śr. {round0(avgTss)} TSS/tydzień</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer>
          <ComposedChart data={recent} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="week_start"
              tick={{ fontSize: 9, fill: "#888" }}
              tickFormatter={(v: string) => `${new Date(v).getDate()} ${MONTH_PL[new Date(v).getMonth()]}`}
              interval={3}
            />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} />
            <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v: any) => `Tydzień: ${v}`} />
            <ReferenceLine y={avgTss} stroke="#FFC107" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Bar dataKey="total_tss" fill="#2196F3" radius={[3, 3, 0, 0]} opacity={0.75} name="TSS" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 2: Moc & Tętno ───────────────────────────────────────────────────────
function PowerTab({ activities2026, weekly2026 }: { activities2026: Activity[]; weekly2026: WeekRow[] }) {
  const withPower = activities2026.filter((a) => a.has_power_data && a.normalized_power && a.moving_time_seconds > 3600);
  const avgNp = withPower.length ? round0(avg(withPower.map((a) => a.normalized_power!))) : null;
  const withHr = activities2026.filter((a) => a.average_heartrate && a.average_heartrate > 0 && a.moving_time_seconds > 3600);
  const avgHr = withHr.length ? round0(avg(withHr.map((a) => a.average_heartrate!))) : null;
  const avgIf = withPower.length ? round1(avg(withPower.filter((a) => a.intensity_factor).map((a) => a.intensity_factor!))) : null;
  const npHr = avgNp && avgHr ? Math.round((avgNp / avgHr) * 100) / 100 : null;

  // Tygodniowy NP + HR trend
  const weeklyChartData = weekly2026.filter((w) => w.avgNp || w.avgHr);

  // Miesięczny NP/HR scatter z aktywności
  const monthlyNpHr = (() => {
    const map = new Map<string, { nps: number[]; hrs: number[] }>();
    for (const a of withPower) {
      const d = new Date(a.start_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { nps: [], hrs: [] });
      map.get(key)!.nps.push(a.normalized_power!);
      if (a.average_heartrate && a.average_heartrate > 0) map.get(key)!.hrs.push(a.average_heartrate);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { nps, hrs }]) => {
        const [, m] = key.split("-").map(Number);
        const np = round0(avg(nps));
        const hr = hrs.length ? round0(avg(hrs)) : null;
        const ratio = np && hr ? Math.round((np / hr) * 100) / 100 : null;
        return { label: MONTH_PL[m - 1], np, hr, ratio };
      });
  })();

  const cards = [
    { l: "Śr. NP (>1h)", v: avgNp ? `${avgNp} W` : "—", sub: `${withPower.length} jazd z mocą`, color: "#2196F3" },
    { l: "Śr. IF (>1h)", v: avgIf ? `${avgIf}` : "—", sub: "Intensity Factor", color: "#FFC107" },
    { l: "Śr. HR (>1h)", v: avgHr ? `${avgHr} bpm` : "—", sub: `${withHr.length} jazd z pulsem`, color: "#f44336" },
    { l: "NP/HR (aerobik)", v: npHr ? `${npHr}` : "—", sub: "wyższy = lepsza forma", color: "#4CAF50" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
        {cards.map((c, i) => (
          <div key={i} style={CARD_STYLE}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 4 }}>{c.l}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: c.color }}>{c.v}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tygodniowy NP */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 4 }}>Tygodniowe NP i tętno (tylko jazdy ≥10 km)</div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Trend mocy znormalizowanej i tętna w czasie — poprawa: NP ↑ przy HR ↔ lub ↓</div>
      <div style={{ height: 220, marginBottom: 24 }}>
        <ResponsiveContainer>
          <ComposedChart data={weeklyChartData} margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="weekLabel" tick={{ fontSize: 9, fill: "#888" }} interval={3} />
            <YAxis yAxisId="np" tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} domain={["auto", "auto"]} />
            <YAxis yAxisId="hr" orientation="right" tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} domain={["auto", "auto"]} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Line yAxisId="np" dataKey="avgNp" stroke="#2196F3" strokeWidth={2} dot={{ r: 3 }} name="NP (W)" connectNulls />
            <Line yAxisId="hr" dataKey="avgHr" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} name="Śr. HR" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Miesięczny NP/HR */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 4 }}>Miesięczny wskaźnik aerobowy NP/HR</div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Efektywność aerobowa — wzrost oznacza poprawę bazy tlenowej</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer>
          <ComposedChart data={monthlyNpHr} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
            <YAxis yAxisId="np" tick={{ fontSize: 10, fill: "#888" }} domain={["auto", "auto"]} />
            <YAxis yAxisId="ratio" orientation="right" tick={{ fontSize: 10, fill: "#888" }} domain={["auto", "auto"]} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Bar yAxisId="np" dataKey="np" fill="rgba(33,150,243,0.25)" name="NP (W)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="ratio" dataKey="ratio" stroke="#4CAF50" strokeWidth={2.5} dot={{ r: 4, fill: "#4CAF50" }} name="NP/HR" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 3: Forma (CTL/ATL/TSB) ───────────────────────────────────────────────
function FormTab({ trainingLoad }: { trainingLoad: TrainingLoadDay[] }) {
  // Ostatnie 90 dni
  const recent = trainingLoad.slice(-90);
  const latest = trainingLoad[trainingLoad.length - 1];
  const ctl = latest ? round1(latest.ctl) : null;
  const atl = latest ? round1(latest.atl) : null;
  const tsb = latest ? round1(latest.tsb) : null;
  const peakCtl = trainingLoad.length ? round1(Math.max(...trainingLoad.map((d) => d.ctl))) : null;

  const tsbColor = !tsb ? "#888" : tsb > 5 ? "#4CAF50" : tsb > -10 ? "#FFC107" : "#f44336";
  const tsbLabel = !tsb ? "brak" : tsb > 5 ? "Wypoczęty" : tsb > -10 ? "Optymalny" : "Zmęczony";

  const formCards = [
    { l: "CTL (Fitness)", v: ctl !== null ? `${ctl}` : "—", sub: "Fitness długoterminowe", color: "#2196F3" },
    { l: "ATL (Fatigue)", v: atl !== null ? `${atl}` : "—", sub: "Zmęczenie krótkoterminowe", color: "#f44336" },
    { l: "TSB (Forma)", v: tsb !== null ? `${tsb > 0 ? "+" : ""}${tsb}` : "—", sub: tsbLabel, color: tsbColor },
    { l: "Peak CTL (sezon)", v: peakCtl !== null ? `${peakCtl}` : "—", sub: "Najwyższy fitness", color: "#FFC107" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {formCards.map((c, i) => (
          <div key={i} style={CARD_STYLE}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 4 }}>{c.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.v}</div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 4 }}>CTL / ATL / TSB — ostatnie 90 dni</div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
        CTL (niebieska) = fitness | ATL (czerwona) = zmęczenie | TSB (zielona) = forma (CTL − ATL)
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <ComposedChart data={recent} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "#888" }}
              tickFormatter={(v: string) => `${new Date(v).getDate()} ${MONTH_PL[new Date(v).getMonth()]}`}
              interval={6}
            />
            <YAxis yAxisId="load" tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} />
            <YAxis yAxisId="tsb" orientation="right" tick={{ fontSize: 10, fill: "#888" }} axisLine={{ stroke: "#333" }} />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v: any, name: any) => [round1(v), name]}
              labelFormatter={(v: any) => new Date(v).toLocaleDateString("pl-PL")}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <ReferenceLine yAxisId="tsb" y={0} stroke="rgba(255,255,255,0.2)" />
            <Area yAxisId="load" dataKey="ctl" stroke="#2196F3" fill="rgba(33,150,243,0.15)" strokeWidth={2} dot={false} name="CTL" />
            <Area yAxisId="load" dataKey="atl" stroke="#f44336" fill="rgba(244,67,54,0.1)" strokeWidth={1.5} dot={false} name="ATL" />
            <Line yAxisId="tsb" dataKey="tsb" stroke="#4CAF50" strokeWidth={2} dot={false} name="TSB" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: "#555", lineHeight: 1.7 }}>
        <span style={{ color: "#4CAF50" }}>TSB +5 do +25</span> = optymalna forma do startu ·{" "}
        <span style={{ color: "#FFC107" }}>TSB -10 do +5</span> = trening lub podtrzymanie ·{" "}
        <span style={{ color: "#f44336" }}>TSB &lt; -20</span> = przemęczenie, ryzyko przetrenowania
      </div>
    </div>
  );
}

// ─── Tab 4: Sezon ─────────────────────────────────────────────────────────────
function SeasonTab({ monthly2026, monthly2025 }: { monthly2026: MonthRow[]; monthly2025: MonthRow[] }) {
  // Kumulatywne km
  const cumData = monthly2026.map((m26, i) => {
    const cum26 = monthly2026.slice(0, i + 1).reduce((s, r) => s + r.km, 0);
    const cum25 = monthly2025.slice(0, i + 1).reduce((s, r) => s + r.km, 0);
    const m25 = monthly2025.find((x) => x.month === m26.month);
    return {
      label: m26.label,
      "2026": m26.km > 0 || i === 0 ? round1(cum26) : null,
      "2025": round1(cum25),
      "km 2026": round1(m26.km),
      "km 2025": round1(m25?.km ?? 0),
    };
  });

  // Tabela miesięczna
  const tableData = monthly2026.map((m26) => {
    const m25 = monthly2025.find((x) => x.month === m26.month);
    const diff = m25 ? round1(m26.km - m25.km) : null;
    return { ...m26, km25: m25?.km ?? 0, diff, rides25: m25?.rides ?? 0, hours25: m25?.hours ?? 0 };
  });

  return (
    <div>
      {/* Kumulatywne km */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 4 }}>Kumulatywne kilometry 2026 vs 2025</div>
      <div style={{ height: 220, marginBottom: 24 }}>
        <ResponsiveContainer>
          <LineChart data={cumData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} unit=" km" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v} km`]} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
            <Line dataKey="2026" stroke="#2196F3" strokeWidth={2.5} dot={{ r: 4, fill: "#2196F3" }} connectNulls />
            <Line dataKey="2025" stroke="#888" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 4" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Miesięczna tabela porównawcza */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "#aaa", marginBottom: 8 }}>Porównanie miesięczne 2026 vs 2025</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {["Miesiąc", "Jazdy '26", "Jazdy '25", "Km '26", "Km '25", "Δ km", "Godz '26", "Przewyż. '26", "NP '26", "TSS '26"].map((h, i) => (
                <th key={i} style={{ padding: "6px 8px", textAlign: i === 0 ? "left" : "right", color: "#888", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((r) => {
              const hasData = r.km > 0;
              const diffColor = r.diff === null ? "#888" : r.diff > 0 ? "#4CAF50" : r.diff < 0 ? "#f44336" : "#888";
              return (
                <tr key={r.month} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: hasData ? 1 : 0.35 }}>
                  <td style={{ padding: "6px 8px", color: "#fff", fontWeight: 500 }}>{r.label}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#ccc" }}>{r.rides}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#666" }}>{r.rides25}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#2196F3", fontWeight: 600 }}>{r.km > 0 ? `${r.km}` : "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#666" }}>{r.km25 > 0 ? r.km25 : "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: diffColor, fontWeight: 600 }}>
                    {r.diff !== null && r.km > 0 ? `${r.diff > 0 ? "+" : ""}${r.diff}` : "—"}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#ccc" }}>{r.hours > 0 ? `${r.hours}h` : "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#ccc" }}>{r.elevation > 0 ? `${r.elevation}m` : "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#FFC107" }}>{r.avgNp ? `${r.avgNp}W` : "—"}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "#ccc" }}>{r.totalTss > 0 ? r.totalTss : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 5: Treningi ──────────────────────────────────────────────────────────
function ActivitiesTab({ activities2026 }: { activities2026: Activity[] }) {
  const [sortKey, setSortKey] = useState<keyof Activity>("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...activities2026].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [activities2026, sortKey, sortDir]);

  const toggleSort = (key: keyof Activity) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const cols: { label: string; key: keyof Activity; fmt: (a: Activity) => string; align: "left" | "right" }[] = [
    { label: "Data", key: "start_date", fmt: (a) => fmtDate(a.start_date), align: "left" },
    { label: "Nazwa", key: "name", fmt: (a) => a.name?.slice(0, 28) ?? "", align: "left" },
    { label: "Typ", key: "sport_type", fmt: (a) => a.sport_type === "VirtualRide" ? "Zwift" : a.sport_type === "GravelRide" ? "Gravel" : "Szosa", align: "left" },
    { label: "Km", key: "distance_meters", fmt: (a) => `${round1(a.distance_meters / 1000)}`, align: "right" },
    { label: "Czas", key: "moving_time_seconds", fmt: (a) => fmtTime(a.moving_time_seconds), align: "right" },
    { label: "NP", key: "normalized_power", fmt: (a) => a.normalized_power ? `${a.normalized_power}W` : "—", align: "right" },
    { label: "IF", key: "intensity_factor", fmt: (a) => a.intensity_factor ? `${round1(a.intensity_factor)}` : "—", align: "right" },
    { label: "TSS", key: "effective_tss", fmt: (a) => a.effective_tss ? `${round0(a.effective_tss)}` : "—", align: "right" },
    { label: "Śr. HR", key: "average_heartrate", fmt: (a) => a.average_heartrate ? `${round0(a.average_heartrate)}` : "—", align: "right" },
    { label: "Wznios.", key: "total_elevation_gain", fmt: (a) => `${round0(a.total_elevation_gain)}m`, align: "right" },
  ];

  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
        {activities2026.length} jazd ≥10 km · kliknij nagłówek kolumny aby sortować
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  style={{
                    padding: "6px 8px",
                    textAlign: c.align,
                    color: sortKey === c.key ? "#fff" : "#888",
                    fontWeight: 500,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.label} {sortKey === c.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                {cols.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "6px 8px",
                      textAlign: c.align,
                      color: c.key === "name" ? "#ddd" : c.key === "distance_meters" ? "#2196F3" : c.key === "normalized_power" ? "#FFC107" : "#aaa",
                      whiteSpace: c.key === "name" ? "nowrap" : "normal",
                      maxWidth: c.key === "name" ? 180 : "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.fmt(a)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TrendyDashboard({ activities2026, activities2025, trainingLoad, weeklySummaries }: Props) {
  const [tab, setTab] = useState(0);

  const monthly2026 = useMemo(() => buildMonthly(activities2026), [activities2026]);
  const monthly2025 = useMemo(() => buildMonthly(activities2025), [activities2025]);
  const weekly2026 = useMemo(() => buildWeekly(activities2026), [activities2026]);

  const tabProps: TabProps = {
    activities2026,
    activities2025,
    trainingLoad,
    weeklySummaries,
    monthly2026,
    monthly2025,
    weeklyFromActs: weekly2026,
  };

  return (
    <div
      style={{
        background: "#0d0d0d",
        color: "#e0e0e0",
        fontFamily: '"SF Pro Display","SF Pro","Helvetica Neue",system-ui,sans-serif',
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "12px 12px 0", background: "rgba(255,255,255,0.02)", borderRadius: "12px 12px 0 0" }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "6px 6px 0 0",
              border: "none",
              borderBottom: tab === i ? "2px solid #2196F3" : "2px solid transparent",
              background: tab === i ? "rgba(33,150,243,0.1)" : "transparent",
              color: tab === i ? "#fff" : "#666",
              fontSize: 11,
              fontWeight: tab === i ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 0 && <SummaryTab {...tabProps} />}
        {tab === 1 && <PowerTab activities2026={activities2026} weekly2026={weekly2026} />}
        {tab === 2 && <FormTab trainingLoad={trainingLoad} />}
        {tab === 3 && <SeasonTab monthly2026={monthly2026} monthly2025={monthly2025} />}
        {tab === 4 && <ActivitiesTab activities2026={activities2026} />}
      </div>
    </div>
  );
}
