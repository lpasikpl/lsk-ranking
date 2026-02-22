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
