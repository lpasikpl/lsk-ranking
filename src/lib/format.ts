export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
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
