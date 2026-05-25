"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AVAILABLE_TAGS, TAG_COLORS } from "@/lib/strava-constants";

interface Props {
  excluded: string[];
}

export function TagFilterBar({ excluded }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function apply(next: string[]) {
    const sp = new URLSearchParams(params.toString());
    if (next.length === 0) sp.delete("excludeTags");
    else sp.set("excludeTags", next.join(","));
    router.push(`/strava?${sp.toString()}`, { scroll: false });
  }

  function toggle(tag: string) {
    apply(excluded.includes(tag) ? excluded.filter((t) => t !== tag) : [...excluded, tag]);
  }

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      style={{
        padding: "10px 0",
      }}
    >
      <span className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
        Wyklucz tagi
      </span>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-white/5"
          style={{
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {excluded.length === 0 ? "Brak wykluczeń" : `${excluded.length} wykluczone`}
          <span className="ml-1.5 opacity-60">▾</span>
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 top-full left-0 rounded-lg p-2 min-w-[240px] space-y-1"
            style={{
              background: "#0f1117",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
            }}
          >
            {AVAILABLE_TAGS.map((tag) => {
              const active = excluded.includes(tag);
              const color = TAG_COLORS[tag] ?? "#94a3b8";
              return (
                <label
                  key={tag}
                  className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(tag)}
                    className="accent-orange-500"
                  />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-white/80">{tag}</span>
                </label>
              );
            })}
            {excluded.length > 0 && (
              <button
                type="button"
                onClick={() => apply([])}
                className="w-full text-left text-xs px-2 py-1.5 mt-1 rounded hover:bg-white/5"
                style={{ color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                Wyczyść wszystkie
              </button>
            )}
          </div>
        )}
      </div>

      {excluded.map((tag) => {
        const color = TAG_COLORS[tag] ?? "#94a3b8";
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full hover:opacity-80"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
            title={`Przywróć: ${tag}`}
          >
            <span className="line-through">{tag}</span>
            <span className="opacity-60">×</span>
          </button>
        );
      })}

      {excluded.length > 0 && (
        <span
          className="text-[10px] uppercase tracking-wider ml-1"
          style={{ color: "rgba(255,255,255,0.3)" }}
          title="Filtr nie wpływa na YTD progress, kumulację, monthly YoY, training load i tygodniowe NP/HR — te wykresy idą z pre-agregowanych widoków."
        >
          (nie obejmuje wykresów z widoków)
        </span>
      )}
    </div>
  );
}
