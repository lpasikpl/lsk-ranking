import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchDashboardData } from "@/lib/strava-queries";
import { DashboardShell } from "@/components/strava/layout/DashboardShell";
import { GoalProgressCard } from "@/components/strava/cards/GoalProgressCard";
import { CumulativeLineChart } from "@/components/strava/charts/CumulativeLineChart";
import { PeriodCompareRow } from "@/components/strava/cards/PeriodCompareRow";
import { YearByTypeCard } from "@/components/strava/cards/YearByTypeCard";
import { NpHrWeeklyChart } from "@/components/strava/charts/NpHrWeeklyChart";
import { NpHrOverlayChart } from "@/components/strava/charts/NpHrOverlayChart";
import { TrainingLoadChart } from "@/components/strava/charts/TrainingLoadChart";
import { WeeklyVolumeChart } from "@/components/strava/charts/WeeklyVolumeChart";
import { PowerZonesChart } from "@/components/strava/charts/PowerZonesChart";
import { HrZonesChart } from "@/components/strava/charts/HrZonesChart";
import { RecentRidesTable } from "@/components/strava/tables/RecentRidesTable";

async function getAdminUser(userId: string | undefined) {
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", userId)
    .single();
  return data;
}

export const revalidate = 3600;

export default async function StravaPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  const user = await getAdminUser(userId);

  if (!user || !user.is_admin) {
    redirect("/");
  }

  const data = await fetchDashboardData();

  return (
    <DashboardShell>
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            {data.ytdProgress && <GoalProgressCard data={data.ytdProgress} />}
          </div>
          <div className="lg:col-span-2">
            <CumulativeLineChart
              currentYear={data.cumulativeDaily}
              prevYear={data.cumulativePrevYear}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <PeriodCompareRow data={data.ytdCompare} />
        <PeriodCompareRow data={data.monthPartialCompare} />
      </section>

      <section>
        <YearByTypeCard data={data.yearlyByType} />
      </section>

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NpHrWeeklyChart data={data.weeklyNpHr} />
          <NpHrOverlayChart
            currentYear={data.npHrCurrentYear}
            prevYear={data.npHrPrevYear}
          />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrainingLoadChart data={data.trainingLoad} />
          <WeeklyVolumeChart data={data.weeklySummaries} />
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PowerZonesChart data={data.weeklySummaries} />
          <HrZonesChart data={data.weeklySummaries} />
        </div>
      </section>

      <section className="space-y-6">
        <RecentRidesTable data={data.recentActivities} title="Wszystkie jazdy 2026" />
        <RecentRidesTable data={data.prevYearActivities} title="Wszystkie jazdy 2025" />
      </section>
    </DashboardShell>
  );
}
