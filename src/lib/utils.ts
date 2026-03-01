export function formatTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${formatNumber(hours)}h ${minutes}m`;
}

export function formatNumber(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatDistance(meters: number): string {
  return formatNumber(meters / 1000);
}

export function getCountryFlag(country: string | null): string {
  if (!country) return "";
  const flags: Record<string, string> = {
    Poland: "🇵🇱",
    Germany: "🇩🇪",
    France: "🇫🇷",
    "United Kingdom": "🇬🇧",
    Italy: "🇮🇹",
    Spain: "🇪🇸",
    Netherlands: "🇳🇱",
    Belgium: "🇧🇪",
    Austria: "🇦🇹",
    Switzerland: "🇨🇭",
    "Czech Republic": "🇨🇿",
    Czechia: "🇨🇿",
    Slovakia: "🇸🇰",
    Hungary: "🇭🇺",
    Ukraine: "🇺🇦",
  };
  return flags[country] || "";
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatKm(km: number): string {
  return Math.round(km).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatDelta(current: number, previous: number): { value: string; positive: boolean; neutral: boolean } {
  if (previous === 0) return { value: "—", positive: true, neutral: true };
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    value: `${sign}${pct.toFixed(0)}%`,
    positive: pct >= 0,
    neutral: Math.abs(pct) < 1,
  };
}

export function getRideType(sportType: string): string {
  if (sportType === "VirtualRide") return "Zwift";
  if (sportType === "GravelRide") return "Gravel";
  return "Szosa";
}

export function getRideColor(sportType: string): string {
  if (sportType === "VirtualRide") return "#3b82f6";
  if (sportType === "GravelRide") return "#22c55e";
  return "#f97316";
}
