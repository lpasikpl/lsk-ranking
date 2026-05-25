export const POWER_ZONE_COLORS = [
  "#3b82f6", // Z1 Recovery — blue
  "#22c55e", // Z2 Endurance — green
  "#eab308", // Z3 Tempo — yellow
  "#f97316", // Z4 Threshold — orange
  "#ef4444", // Z5 VO2max — red
  "#a855f7", // Z6 Anaerobic — purple
  "#ec4899", // Z7 Neuromuscular — pink
];

export const POWER_ZONE_NAMES = [
  "Z1 Recovery",
  "Z2 Endurance",
  "Z3 Tempo",
  "Z4 Threshold",
  "Z5 VO2max",
  "Z6 Anaerobic",
  "Z7 Neuromuscular",
];

export const HR_ZONE_COLORS = [
  "#3b82f6", // Z1 Recovery — blue
  "#22c55e", // Z2 Aerobic — green
  "#eab308", // Z3 Tempo — yellow
  "#f97316", // Z4 Threshold — orange
  "#ef4444", // Z5 VO2max — red
];

export const HR_ZONE_NAMES = [
  "Z1 Recovery",
  "Z2 Aerobic",
  "Z3 Tempo",
  "Z4 Threshold",
  "Z5 VO2max",
];

export const RIDE_TYPE_COLORS: Record<string, string> = {
  Szosa: "#f97316",
  Gravel: "#22c55e",
  Zwift: "#3b82f6",
};

export const CURRENT_YEAR = new Date().getFullYear();

export const AVAILABLE_TAGS = [
  "Zawody",
  "Trening",
  "Aktywność w ramach dojazdu",
  "W słusznej sprawie",
  "Regeneracja",
  "Z dzieckiem",
  "Ze zwierzęciem",
  "Jazda na rowerze stacjonarnym",
  "Obóz",
] as const;

export type ActivityTag = (typeof AVAILABLE_TAGS)[number];

export const TAG_COLORS: Record<string, string> = {
  "Zawody": "#ef4444",
  "Trening": "#f97316",
  "Aktywność w ramach dojazdu": "#3b82f6",
  "W słusznej sprawie": "#22c55e",
  "Regeneracja": "#a855f7",
  "Z dzieckiem": "#ec4899",
  "Ze zwierzęciem": "#eab308",
  "Jazda na rowerze stacjonarnym": "#64748b",
  "Obóz": "#14b8a6",
};
