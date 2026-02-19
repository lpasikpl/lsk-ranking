import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { RankingEntry, User } from "@/types/database";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { pl } from "date-fns/locale";
import RankingHeader from "@/components/RankingHeader";
import PeriodNav from "@/components/PeriodNav";
import Top3Podium from "@/components/Top3Podium";
import RankingTableDark from "@/components/RankingTableDark";
import MonthlyChart from "@/components/MonthlyChart";
import Footer from "@/components/Footer";
import { formatDistance, formatTime } from "@/lib/strava";

interface PageProps {
  searchParams: Promise<{ period?: string; year?: string; month?: string; chart?: string }>;
}

async function getCurrentUser(userId: string | undefined) {
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, profile_medium, is_admin, is_active")
    .eq("id", userId)
    .single();
  return data as Pick<User, "id" | "strava_id" | "firstname" | "lastname" | "profile_medium" | "is_admin" | "is_active"> | null;
}

async function getRankingData(period: "month" | "year", year: number, month: number): Promise<RankingEntry[]> {
  const supabase = createServiceClient();
  const date = new Date(year, month - 1, 1);
  const startDate = period === "month" ? startOfMonth(date) : startOfYear(date);
  const endDate = period === "month" ? endOfMonth(date) : endOfYear(date);
  const { data, error } = await supabase.rpc("get_ranking", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });
  if (error) { console.error("Ranking error:", error); return []; }
  return (data as RankingEntry[]) || [];
}

async function getMonthlyData(year: number) {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("get_monthly_stats", {
    p_year: year,
    p_user_id: null,
  });
  return data || [];
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;

  const period = (params.period === "year" ? "year" : "month") as "month" | "year";
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const chartMetric = (params.chart || "distance") as "distance" | "elevation" | "time" | "count";

  const [user, rankingData, monthlyData] = await Promise.all([
    getCurrentUser(userId),
    getRankingData(period, year, month),
    getMonthlyData(year),
  ]);

  const currentDate = new Date(year, month - 1, 1);
  const periodLabel = period === "month"
    ? format(currentDate, "LLLL yyyy", { locale: pl }).toUpperCase()
    : year.toString();
  const subtitle = period === "month" ? "Ranking Miesiąca" : "Ranking Roczny";

  const totalDistance = rankingData.reduce((s, e) => s + e.total_distance, 0);
  const totalElevation = rankingData.reduce((s, e) => s + e.total_elevation, 0);
  const totalTime = rankingData.reduce((s, e) => s + e.total_time, 0);
  const totalActivities = rankingData.reduce((s, e) => s + (e.activity_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <RankingHeader title={periodLabel} subtitle={subtitle} user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Period nav */}
        <div className="flex justify-center mb-10">
          <PeriodNav period={period} year={year} month={month} />
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Dystans", value: formatDistance(totalDistance), unit: "km", icon: "🚴" },
            { label: "Przewyższenie", value: Math.round(totalElevation).toLocaleString("pl-PL"), unit: "m", icon: "⛰️" },
            { label: "Czas jazdy", value: formatTime(totalTime), unit: "h", icon: "⏱️" },
            { label: "Aktywności", value: totalActivities.toString(), unit: "szt.", icon: "📊" },
          ].map((stat) => (
            <div key={stat.label} className="glass glass-hover rounded-2xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.unit}</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top 3 */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Top 3</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Top3Podium entries={rankingData} metric="distance" title="Dystans" unit="km" />
            <Top3Podium entries={rankingData} metric="elevation" title="Przewyższenie" unit="m" />
            <Top3Podium entries={rankingData} metric="time" title="Czas" unit="h" />
          </div>
        </div>

        {/* Pełny ranking */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">
            Ranking dystansu
          </h2>
          <RankingTableDark entries={rankingData} isAdmin={user?.is_admin === true} />
        </div>

        {/* Wykres miesięczny */}
        <div className="mb-10">
          <MonthlyChart data={monthlyData} year={year} metric={chartMetric} />
        </div>

        {/* CTA */}
        {!user && (
          <div className="glass rounded-2xl p-8 text-center border border-orange-500/10">
            <div className="text-3xl mb-3">🚴‍♂️</div>
            <p className="text-gray-400 mb-5 font-medium">Dołącz do rankingu i ścigaj się ze znajomymi</p>
            <a
              href="/api/auth/strava"
              className="inline-flex items-center gap-2 gradient-orange text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Zaloguj przez Stravę
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
