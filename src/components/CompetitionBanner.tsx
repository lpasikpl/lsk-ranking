"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const TARGET = new Date("2026-04-01T00:00:00");

function useCountdown() {
  const [diff, setDiff] = useState(() => Math.max(0, TARGET.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, TARGET.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

export default function CompetitionBanner() {
  const { days, hours, minutes, seconds, done } = useCountdown();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Pre-Rywalizacja — aktywna */}
      <Link
        href="/rywalizacja"
        className="glass rounded-xl border border-orange-500/20 px-3 py-2 hover:border-orange-500/40 transition-colors flex items-center gap-3"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
        <span className="text-sm font-bold text-white tracking-tight">Pre-Rywalizacja 2026</span>
        <span className="text-xs text-gray-500">Sty – Mar</span>
      </Link>

      {/* Rywalizacja 2026 — nieaktywna */}
      <div className="glass rounded-xl border border-white/[0.06] px-3 py-2 flex items-center gap-3 opacity-50 cursor-default">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
        <span className="text-sm font-bold text-white/40 tracking-tight">Rywalizacja 2026</span>
        <span className="text-xs text-gray-600">Kwi – Wrz</span>
        {!done && (
          <span className="text-xs text-gray-600 tabular-nums">
            {String(days).padStart(2, "0")}d {String(hours).padStart(2, "0")}h {String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
          </span>
        )}
      </div>
    </div>
  );
}
