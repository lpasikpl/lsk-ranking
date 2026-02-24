import { createServiceClient } from "@/lib/supabase/server";
import {
  SEASON_MONTHS,
  EFFORT_DISTANCES,
  EFFORT_WEIGHTS,
  POINTS_SCALE,
  type Athlete,
  type CategoryScore,
  type EffortDistance,
  type ActiveDaysBonus,
  type LongestRideBonus,
  type MonthBreakdown,
  type MonthResult,
  type SeasonData,
} from "@/lib/competition-types";

export * from "@/lib/competition-types";

function getBasePoints(position: number): number {
  if (position < 1 || position > POINTS_SCALE.length) return 0;
  return POINTS_SCALE[position - 1];
}

function buildCategoryScores(
  values: Record<string, number>,
  weight: number,
  higherIsBetter: boolean
): Record<string, CategoryScore> {
  const entries = Object.entries(values).sort(([, a], [, b]) =>
    higherIsBetter ? b - a : a - b
  );
  const result: Record<string, CategoryScore> = {};
  let position = 1;
  entries.forEach(([userId, value], idx) => {
    // Dense rank: remis = to samo miejsce
    if (idx > 0 && value !== entries[idx - 1][1]) position = idx + 1;
    const basePoints = getBasePoints(position);
    result[userId] = {
      value,
      position,
      basePoints,
      points: Math.round(basePoints * weight * 10) / 10,
    };
  });
  return result;
}

export async function getSeasonData(year: number): Promise<SeasonData> {
  const supabase = createServiceClient();

  const pad = (n: number) => String(n).padStart(2, "0");
  const seasonStart = `${year}-01-01T00:00:00`;
  const seasonEnd = `${year}-03-31T23:59:59`;

  const [usersResult, activitiesResult, effortsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, strava_id, firstname, lastname, profile_medium")
      .eq("is_active", true),
    supabase
      .from("lsk_activities")
      .select("user_id, strava_id, distance, total_elevation_gain, start_date_local, name")
      .gte("start_date_local", seasonStart)
      .lte("start_date_local", seasonEnd),
    supabase
      .from("lsk_best_efforts")
      .select("user_id, strava_activity_id, effort_name, moving_time, activity_date")
      .gte("activity_date", seasonStart)
      .lte("activity_date", seasonEnd),
  ]);

  const athletes: Athlete[] = (usersResult.data || []).map((u) => ({
    userId: u.id,
    firstname: u.firstname,
    lastname: u.lastname,
    profileMedium: u.profile_medium,
    stravaId: u.strava_id,
  }));

  const activeUserIds = new Set(athletes.map((a) => a.userId));
  const activities = (activitiesResult.data || []).filter((a) => activeUserIds.has(a.user_id));
  const efforts = (effortsResult.data || []).filter((e) => activeUserIds.has(e.user_id));

  const months: MonthResult[] = [];
  const monthScores: Record<string, Partial<Record<number, number>>> = {};

  for (const month of SEASON_MONTHS) {
    const lastDay = new Date(year, month, 0).getDate();
    const monthStartStr = `${year}-${pad(month)}-01`;
    const monthEndStr = `${year}-${pad(month)}-${pad(lastDay)}`;

    const monthActivities = activities.filter((a) => {
      const d = a.start_date_local.substring(0, 10);
      return d >= monthStartStr && d <= monthEndStr;
    });

    const monthEfforts = efforts.filter((e) => {
      const d = (e.activity_date as string).substring(0, 10);
      return d >= monthStartStr && d <= monthEndStr;
    });

    // Aggregate per user
    const distanceMap: Record<string, number> = {};
    const activeDaysMap: Record<string, Set<string>> = {};
    const elevationMap: Record<string, number> = {};

    for (const act of monthActivities) {
      const uid = act.user_id;
      distanceMap[uid] = (distanceMap[uid] || 0) + act.distance;
      if (!activeDaysMap[uid]) activeDaysMap[uid] = new Set();
      activeDaysMap[uid].add(act.start_date_local.substring(0, 10));
      elevationMap[uid] = (elevationMap[uid] || 0) + act.total_elevation_gain;
    }

    const activeDaysCount: Record<string, number> = {};
    for (const [uid, days] of Object.entries(activeDaysMap)) {
      activeDaysCount[uid] = days.size;
    }

    // Best efforts: min time per user per distance (+ strava_activity_id)
    const effortBestMap: Record<string, Partial<Record<EffortDistance, { time: number; stravaActivityId: number }>>> = {};
    for (const eff of monthEfforts) {
      const uid = eff.user_id;
      const name = eff.effort_name as EffortDistance;
      if (!EFFORT_DISTANCES.includes(name)) continue;
      if (!effortBestMap[uid]) effortBestMap[uid] = {};
      const current = effortBestMap[uid][name];
      if (current === undefined || eff.moving_time < current.time) {
        effortBestMap[uid][name] = { time: eff.moving_time, stravaActivityId: eff.strava_activity_id };
      }
    }

    // Najdłuższa jazda — max 1 per zawodnik, dense rank, bonus +3/+2/+1
    const sortedByDist = [...monthActivities].sort((a, b) => b.distance - a.distance);
    const longestRides: LongestRideBonus[] = [];
    const seenUsers = new Set<string>();
    const bestPerUser: Array<{ userId: string; distance: number; activityName: string | null; stravaId: number }> = [];
    for (const act of sortedByDist) {
      if (seenUsers.has(act.user_id)) continue;
      seenUsers.add(act.user_id);
      bestPerUser.push({ userId: act.user_id, distance: act.distance, activityName: act.name, stravaId: act.strava_id });
    }
    let ridePosition = 1;
    bestPerUser.forEach((rider, idx) => {
      if (idx > 0 && rider.distance !== bestPerUser[idx - 1].distance) ridePosition = idx + 1;
      const bonus = ([3, 2, 1] as const)[ridePosition - 1] ?? 0;
      if (bonus > 0) longestRides.push({ ...rider, bonus });
    });

    // Category scores
    const distScores = buildCategoryScores(distanceMap, 1.0, true);
    const elevScores = buildCategoryScores(elevationMap, 1.0, true);

    // Aktywne dni — bonus +3/+2/+1, dense rank (remis = to samo miejsce i bonus)
    const sortedDays = Object.entries(activeDaysCount).sort(([, a], [, b]) => b - a);
    const activeDaysBonuses: ActiveDaysBonus[] = [];
    let daysPosition = 1;
    sortedDays.forEach(([userId, days], idx) => {
      if (idx > 0 && days !== sortedDays[idx - 1][1]) daysPosition = idx + 1;
      const bonus = ([3, 2, 1] as const)[daysPosition - 1] ?? 0;
      if (bonus > 0) activeDaysBonuses.push({ userId, days, bonus });
    });

    const effortScoresMap: Partial<Record<EffortDistance, Record<string, CategoryScore>>> = {};
    for (const dist of EFFORT_DISTANCES) {
      const valuesForDist: Record<string, number> = {};
      for (const [uid, userEfforts] of Object.entries(effortBestMap)) {
        const t = userEfforts[dist];
        if (t !== undefined) valuesForDist[uid] = t.time;
      }
      if (Object.keys(valuesForDist).length > 0) {
        const scores = buildCategoryScores(valuesForDist, EFFORT_WEIGHTS[dist], false);
        // Attach stravaActivityId to each score
        for (const [uid, score] of Object.entries(scores)) {
          score.stravaActivityId = effortBestMap[uid]?.[dist]?.stravaActivityId;
        }
        effortScoresMap[dist] = scores;
      }
    }

    // Build breakdown per athlete
    const breakdown: Record<string, MonthBreakdown> = {};
    const monthScoresForMonth: Record<string, number> = {};

    const participatingUsers = new Set([
      ...Object.keys(distanceMap),
      ...Object.keys(activeDaysCount),
      ...Object.keys(elevationMap),
      ...Object.keys(effortBestMap),
      ...longestRides.map((r) => r.userId),
      ...activeDaysBonuses.map((b) => b.userId),
    ]);

    for (const userId of participatingUsers) {
      const distScore = distScores[userId] ?? null;
      const daysEntry = activeDaysBonuses.find((b) => b.userId === userId);
      const activeDays = { count: activeDaysCount[userId] ?? 0, bonus: daysEntry?.bonus ?? 0 };
      const elevScore = elevScores[userId] ?? null;

      const effortBreakdown: Partial<Record<EffortDistance, CategoryScore>> = {};
      for (const dist of EFFORT_DISTANCES) {
        const s = effortScoresMap[dist]?.[userId];
        if (s) effortBreakdown[dist] = s;
      }

      const longestRideEntry = longestRides.find((r) => r.userId === userId);
      const longestRide = longestRideEntry
        ? { distance: longestRideEntry.distance, bonus: longestRideEntry.bonus, stravaId: longestRideEntry.stravaId }
        : null;

      const effortTotal = EFFORT_DISTANCES.reduce(
        (s, d) => s + (effortBreakdown[d]?.points ?? 0),
        0
      );

      const total =
        (distScore?.points ?? 0) +
        activeDays.bonus +
        (elevScore?.points ?? 0) +
        effortTotal +
        (longestRide?.bonus ?? 0);

      breakdown[userId] = {
        distance: distScore,
        activeDays,
        elevation: elevScore,
        efforts: effortBreakdown,
        longestRide,
        total,
      };

      monthScoresForMonth[userId] = total;
    }

    months.push({
      month,
      scores: monthScoresForMonth,
      breakdown,
      longestRides,
    });

    for (const [uid, score] of Object.entries(monthScoresForMonth)) {
      if (!monthScores[uid]) monthScores[uid] = {};
      monthScores[uid][month] = score;
    }
  }

  const totalScores: Record<string, number> = {};
  for (const athlete of athletes) {
    totalScores[athlete.userId] = SEASON_MONTHS.reduce(
      (sum, m) => sum + (monthScores[athlete.userId]?.[m] ?? 0),
      0
    );
  }

  return { year, athletes, months, totalScores, monthScores };
}
