import { createClient } from "@/lib/supabase/server";
import { RankingEntry } from "@/types/database";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";

export type RankingPeriod = "month" | "year";

export interface RankingData {
  entries: RankingEntry[];
  period: RankingPeriod;
  date: Date;
  dateLabel: string;
}

export async function getRanking(
  period: RankingPeriod,
  date: Date
): Promise<RankingEntry[]> {
  const supabase = await createClient();

  let startDate: Date;
  let endDate: Date;

  if (period === "month") {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
  } else {
    startDate = startOfYear(date);
    endDate = endOfYear(date);
  }

  const { data, error } = await supabase.rpc("get_ranking", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });

  if (error) {
    console.error("Ranking query error:", error);
    return [];
  }

  return data as RankingEntry[];
}

export function getDateLabel(period: RankingPeriod, date: Date): string {
  if (period === "month") {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return `${format(start, "dd MMM", { locale: undefined })} - ${format(end, "dd MMM", { locale: undefined })}`;
  }
  return format(date, "yyyy");
}

export function getPeriodLabel(period: RankingPeriod, date: Date): string {
  if (period === "month") {
    return "RANKING MIESIĄCA";
  }
  return `RANKING ${format(date, "yyyy")}`;
}
