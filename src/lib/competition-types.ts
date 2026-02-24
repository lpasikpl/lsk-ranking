export const POINTS_SCALE = [15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
export const SEASON_MONTHS = [1, 2, 3] as const;
export type SeasonMonth = (typeof SEASON_MONTHS)[number];

export const MONTH_NAMES: Record<number, string> = {
  1: "Styczeń", 2: "Luty",
  3: "Marzec", 4: "Kwiecień", 5: "Maj", 6: "Czerwiec",
  7: "Lipiec", 8: "Sierpień", 9: "Wrzesień",
};
export const MONTH_SHORT: Record<number, string> = {
  1: "Sty", 2: "Lut",
  3: "Mar", 4: "Kwi", 5: "Maj", 6: "Cze",
  7: "Lip", 8: "Sie", 9: "Wrz",
};

export const EFFORT_DISTANCES = ["10 km", "20 km", "30 km", "50 km", "80 km", "100 km"] as const;
export type EffortDistance = (typeof EFFORT_DISTANCES)[number];

export const EFFORT_WEIGHTS: Record<EffortDistance, number> = {
  "10 km": 0.1, "20 km": 0.2, "30 km": 0.4,
  "50 km": 0.6, "80 km": 0.8, "100 km": 1.0,
};

export type Athlete = {
  userId: string;
  firstname: string | null;
  lastname: string | null;
  profileMedium: string | null;
  stravaId: number;
};

export type CategoryScore = {
  value: number;
  position: number;
  basePoints: number;
  points: number;
  stravaActivityId?: number;
};

export type LongestRideBonus = {
  userId: string;
  distance: number;
  activityName: string | null;
  bonus: number;
  stravaId: number;
};

export type ActiveDaysBonus = {
  userId: string;
  days: number;
  bonus: number;
};

export type MonthBreakdown = {
  distance: CategoryScore | null;
  activeDays: { count: number; bonus: number };
  elevation: CategoryScore | null;
  efforts: Partial<Record<EffortDistance, CategoryScore>>;
  longestRide: { distance: number; bonus: number; stravaId: number } | null;
  total: number;
};

export type MonthResult = {
  month: number;
  scores: Record<string, number>;
  breakdown: Record<string, MonthBreakdown>;
  longestRides: LongestRideBonus[];
};

export type SeasonData = {
  year: number;
  athletes: Athlete[];
  months: MonthResult[];
  totalScores: Record<string, number>;
  monthScores: Record<string, Partial<Record<number, number>>>;
};
