// Klient do samo-hostowanego serwera Garmin MCP (streamable HTTP + SSE).
// URL z tokenem w ścieżce trzymany w env GARMIN_MCP_URL.
import type { GarminDaily } from "./strava-types";

const PROTOCOL_VERSION = "2024-11-05";

interface RpcResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsons: any[];
  sessionId?: string;
}

async function postRpc(url: string, sessionId: string | undefined, body: unknown): Promise<RpcResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  const sid = res.headers.get("mcp-session-id") ?? sessionId;
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsons: any[] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.startsWith("data:")) {
      try { jsons.push(JSON.parse(t.slice(5).trim())); } catch { /* ignore keep-alive */ }
    } else if (t.startsWith("{")) {
      try { jsons.push(JSON.parse(t)); } catch { /* ignore */ }
    }
  }
  return { jsons, sessionId: sid ?? undefined };
}

export type CallTool = (name: string, args: Record<string, unknown>) => Promise<unknown>;

// Otwiera sesję MCP (initialize + initialized) i zwraca funkcję callTool.
export async function openGarminSession(): Promise<CallTool> {
  const url = process.env.GARMIN_MCP_URL;
  if (!url) throw new Error("GARMIN_MCP_URL nie ustawione");

  const init = await postRpc(url, undefined, {
    jsonrpc: "2.0", id: 1, method: "initialize",
    params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "lsk-ranking", version: "1.0" } },
  });
  const sid = init.sessionId;
  if (!sid) throw new Error("MCP: brak mcp-session-id po initialize");

  await postRpc(url, sid, { jsonrpc: "2.0", method: "notifications/initialized" });

  let idCounter = 2;
  return async (name, args) => {
    const r = await postRpc(url, sid, {
      jsonrpc: "2.0", id: idCounter++, method: "tools/call",
      params: { name, arguments: args },
    });
    const msg = r.jsons.find((j) => j.id != null && (j.result !== undefined || j.error !== undefined));
    if (msg?.error) throw new Error(`MCP ${name}: ${msg.error.message ?? "error"}`);
    const textContent = msg?.result?.content?.find((c: { type: string }) => c.type === "text")?.text;
    if (typeof textContent === "string") {
      try { return JSON.parse(textContent); } catch { return textContent; }
    }
    return msg?.result;
  };
}

const num = (v: unknown): number | null => (typeof v === "number" && !Number.isNaN(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

// Pobiera i składa pełny rekord dzienny dla podanej daty (YYYY-MM-DD).
export async function fetchGarminDay(callTool: CallTool, date: string): Promise<GarminDaily> {
  const [hrvRaw, readyRaw, sleepRaw] = await Promise.all([
    callTool("get_hrv", { date }).catch(() => null),
    callTool("get_training_readiness", { date }).catch(() => null),
    callTool("get_sleep_data", { date }).catch(() => null),
  ]);

  // HRV
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hrvSummary = (hrvRaw as any)?.hrvSummary ?? null;

  // Gotowość — tablica wpisów; wybierz poranny finalny (AFTER_WAKEUP_RESET, najnowszy timestamp), fallback max score
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readyArr: any[] = Array.isArray(readyRaw) ? readyRaw : readyRaw ? [readyRaw] : [];
  const awr = readyArr
    .filter((e) => e?.inputContext === "AFTER_WAKEUP_RESET")
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    .at(-1);
  const ready = awr ?? [...readyArr].sort((a, b) => (a?.score ?? -1) - (b?.score ?? -1)).at(-1) ?? null;

  // Sen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sleep = sleepRaw as any;
  const dto = sleep?.dailySleepDTO ?? null;

  return {
    calendar_date: date,
    hrv_last_night: num(hrvSummary?.lastNightAvg),
    hrv_weekly_avg: num(hrvSummary?.weeklyAvg) ?? num(ready?.hrvWeeklyAverage),
    hrv_status: str(hrvSummary?.status),
    hrv_baseline_low: num(hrvSummary?.baseline?.balancedLow),
    hrv_baseline_upper: num(hrvSummary?.baseline?.balancedUpper),
    resting_hr: num(sleep?.restingHeartRate),
    readiness_score: num(ready?.score),
    readiness_level: str(ready?.level),
    readiness_feedback: str(ready?.feedbackShort),
    acute_load: num(ready?.acuteLoad),
    recovery_time: num(ready?.recoveryTime),
    sleep_score: num(dto?.sleepScores?.overall?.value) ?? num(ready?.sleepScore),
    sleep_seconds: num(dto?.sleepTimeSeconds),
    deep_seconds: num(dto?.deepSleepSeconds),
    light_seconds: num(dto?.lightSleepSeconds),
    rem_seconds: num(dto?.remSleepSeconds),
    awake_seconds: num(dto?.awakeSleepSeconds),
    sleep_avg_hr: num(dto?.avgHeartRate),
    sleep_avg_overnight_hrv: num(sleep?.avgOvernightHrv),
    sleep_avg_stress: num(dto?.avgSleepStress),
    sleep_avg_respiration: num(dto?.averageRespirationValue),
    sleep_feedback: str(dto?.sleepScoreFeedback),
  };
}
