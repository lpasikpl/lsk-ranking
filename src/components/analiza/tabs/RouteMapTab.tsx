// Mapa trasy z Canvas colorowana strefami mocy
"use client";
import { useRef, useEffect, useState } from "react";

const ZONE_COLORS = ["#8B8B8B","#2196F3","#4CAF50","#FFC107","#FF9800","#f44336","#9C27B0"];

function getPowerZone(power: number | null, ftp: number): number {
  if (!power || power <= 0) return 0;
  const pct = power / ftp;
  if (pct < 0.55) return 0;
  if (pct < 0.75) return 1;
  if (pct < 0.90) return 2;
  if (pct < 1.05) return 3;
  if (pct < 1.20) return 4;
  if (pct < 1.50) return 5;
  return 6;
}

interface Record {
  latitude: number | null;
  longitude: number | null;
  power: number | null;
  heart_rate: number | null;
  cadence: number | null;
  speed: number | null;
  temperature: number | null;
}

interface RouteMapTabProps {
  records: Record[];
  ftp: number;
}

export default function RouteMapTab({ records, ftp }: RouteMapTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; record: Record } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 450 });
  const pointsRef = useRef<{ cx: number; cy: number; record: Record }[]>([]);

  // Filtruj rekordy z GPS
  const gpsRecords = records.filter(r => r.latitude != null && r.longitude != null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gpsRecords.length < 2) return;

    const W = canvas.offsetWidth || 800;
    const H = Math.round(W * 0.5);
    canvas.width = W;
    canvas.height = H;
    setCanvasSize({ w: W, h: H });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);

    const lats = gpsRecords.map(r => r.latitude as number);
    const lons = gpsRecords.map(r => r.longitude as number);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const avgLat = (minLat + maxLat) / 2;
    const cosCorrection = Math.cos((avgLat * Math.PI) / 180);

    const latRange = maxLat - minLat || 0.001;
    const lonRange = (maxLon - minLon) * cosCorrection || 0.001;

    const padding = 40;
    const scaleX = (W - 2 * padding) / lonRange;
    const scaleY = (H - 2 * padding) / latRange;
    const scale = Math.min(scaleX, scaleY);

    const toX = (lon: number) =>
      padding + ((lon - minLon) * cosCorrection) * scale + (W - 2 * padding - lonRange * scale) / 2;
    const toY = (lat: number) =>
      H - padding - (lat - minLat) * scale - (H - 2 * padding - latRange * scale) / 2;

    // Rysuj trasę
    const points: typeof pointsRef.current = [];

    for (let i = 1; i < gpsRecords.length; i++) {
      const prev = gpsRecords[i - 1];
      const curr = gpsRecords[i];

      const x1 = toX(prev.longitude as number);
      const y1 = toY(prev.latitude as number);
      const x2 = toX(curr.longitude as number);
      const y2 = toY(curr.latitude as number);

      const zoneIdx = getPowerZone(curr.power, ftp);
      const color = curr.power ? ZONE_COLORS[zoneIdx] : "#555";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      points.push({ cx: x2, cy: y2, record: curr });
    }
    pointsRef.current = points;

    // Start (zielona kropka)
    const startX = toX(gpsRecords[0].longitude as number);
    const startY = toY(gpsRecords[0].latitude as number);
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#4CAF50";
    ctx.fill();

    // Meta (czerwona kropka)
    const endRec = gpsRecords[gpsRecords.length - 1];
    const endX = toX(endRec.longitude as number);
    const endY = toY(endRec.latitude as number);
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f44336";
    ctx.fill();
  }, [gpsRecords, ftp]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Znajdz najblizszy punkt
    let closest = null;
    let minDist = 20;
    for (const pt of pointsRef.current) {
      const d = Math.sqrt((pt.cx - mx) ** 2 + (pt.cy - my) ** 2);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    }
    setTooltip(closest ? { x: closest.cx, y: closest.cy, record: closest.record } : null);
  };

  if (gpsRecords.length < 2) {
    return (
      <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
        Brak danych GPS w tym treningu
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none rounded-lg px-3 py-2 text-xs"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 10,
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#ccc",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.8)",
            }}
          >
            {tooltip.record.power != null && <div>Moc: <b>{tooltip.record.power} W</b></div>}
            {tooltip.record.heart_rate != null && <div>HR: <b>{tooltip.record.heart_rate} bpm</b></div>}
            {tooltip.record.cadence != null && <div>Kadencja: <b>{tooltip.record.cadence} rpm</b></div>}
            {tooltip.record.speed != null && <div>Predkosc: <b>{tooltip.record.speed} km/h</b></div>}
            {tooltip.record.temperature != null && <div>Temp: <b>{tooltip.record.temperature} C</b></div>}
          </div>
        )}
      </div>

      {/* Legenda stref */}
      <div className="flex flex-wrap gap-3">
        {["Z1 < 55%","Z2 55-75%","Z3 75-90%","Z4 90-105%","Z5 105-120%","Z6 120-150%","Z7 > 150%"].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <div className="w-3 h-2 rounded-sm" style={{ background: ZONE_COLORS[i] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
