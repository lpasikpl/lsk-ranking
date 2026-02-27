import { CURRENT_YEAR } from "@/lib/strava-constants";

export function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-[var(--accent-orange)]">Strava</span> Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Sezon {CURRENT_YEAR} — kolarstwo szosowe
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>
    </header>
  );
}
