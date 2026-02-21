import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { RankingEntry, User } from "@/types/database";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { pl } from "date-fns/locale";
import RankingHeader from "@/components/RankingHeader";
import Top3Podium from "@/components/Top3Podium";
import RankingTableDark from "@/components/RankingTableDark";
import MonthlyChart from "@/components/MonthlyChart";
import TopEfforts from "@/components/TopEfforts";
import DailyChart from "@/components/DailyChart";
import SectionNav from "@/components/SectionNav";
import AnimatedStatCard from "@/components/AnimatedStatCard";
import Footer from "@/components/Footer";
import { formatDistance, formatTime, formatNumber } from "@/lib/format";

interface PageProps {
  searchParams: Promise<{ chart?: string; month?: string; year?: string; ryear?: string }>;
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

async function getDailyData(year: number, month: number) {
  const supabase = createServiceClient();
  const { data } = await supabase.rpc("get_daily_stats", {
    p_year: year,
    p_month: month,
    p_user_id: null,
  });
  return data || [];
}

function StatsCards({ entries }: { entries: RankingEntry[] }) {
  const totalDistance = entries.reduce((s, e) => s + e.total_distance, 0);
  const totalElevation = entries.reduce((s, e) => s + e.total_elevation, 0);
  const totalTime = entries.reduce((s, e) => s + e.total_time, 0);
  const totalActivities = entries.reduce((s, e) => s + (e.activity_count || 0), 0);

  const stats = [
    { icon: "🚴", raw: Math.round(totalDistance / 1000), formatted: formatDistance(totalDistance), unit: "km", label: "Dystans", delay: 0, isTime: false },
    { icon: "⛰️", raw: Math.round(totalElevation), formatted: formatNumber(totalElevation), unit: "m", label: "Przewyższenie", delay: 120, isTime: false },
    { icon: "⏱️", raw: totalTime, formatted: formatTime(totalTime), unit: "h", label: "Czas jazdy", delay: 240, isTime: true },
    { icon: "📊", raw: totalActivities, formatted: formatNumber(totalActivities), unit: "szt.", label: "Aktywności", delay: 360, isTime: false },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <AnimatedStatCard
          key={s.label}
          icon={s.icon}
          rawValue={s.raw}
          formattedValue={s.formatted}
          unit={s.unit}
          label={s.label}
          delay={s.delay}
          isTime={s.isTime}
        />
      ))}
    </div>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const chartMetric = (params.chart || "distance") as "distance" | "elevation" | "time" | "count";

  const selYear = params.year ? parseInt(params.year) : currentYear;
  const selMonth = params.month ? parseInt(params.month) : currentMonth;
  const selRYear = params.ryear ? parseInt(params.ryear) : currentYear;

  const [user, monthData, yearData, monthlyData, dailyData] = await Promise.all([
    getCurrentUser(userId),
    getRankingData("month", selYear, selMonth),
    getRankingData("year", selRYear, 1),
    getMonthlyData(selRYear),
    getDailyData(selYear, selMonth),
  ]);

  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const isAdmin = user?.is_admin === true;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <RankingHeader title="LSK Ranking" subtitle="Kolarstwo" user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* ===== MIESIĄC ===== */}
        <div className="mb-14 section-enter">
          <SectionNav type="month" year={selYear} month={selMonth} color="orange" />

          <StatsCards entries={monthData} />

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Top 3</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Top3Podium entries={monthData} metric="distance" title="Dystans" unit="km" />
              <Top3Podium entries={monthData} metric="elevation" title="Przewyższenie" unit="m" />
              <Top3Podium entries={monthData} metric="time" title="Czas" unit="h" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Ranking dystansu</h2>
            <RankingTableDark key={`month-${selYear}-${selMonth}`} entries={monthData} isAdmin={isAdmin} />
          </div>

          <DailyChart data={dailyData} year={selYear} month={selMonth} daysInMonth={daysInMonth} />

          <TopEfforts year={selYear} month={selMonth} />
        </div>

        {/* Separator */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="text-xs text-white/20 uppercase tracking-widest font-semibold">↑ miesiąc · rok ↓</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* ===== ROK ===== */}
        <div className="mb-14 section-enter" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <SectionNav type="year" year={selRYear} month={1} color="blue" />

          <StatsCards entries={yearData} />

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Top 3 <span className="text-gray-700">— {selRYear}</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Top3Podium entries={yearData} metric="distance" title="Dystans" unit="km" />
              <Top3Podium entries={yearData} metric="elevation" title="Przewyższenie" unit="m" />
              <Top3Podium entries={yearData} metric="time" title="Czas" unit="h" />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Ranking dystansu <span className="text-gray-700">— {selRYear}</span></h2>
            <RankingTableDark key={`year-${selRYear}`} entries={yearData} isAdmin={isAdmin} />
          </div>
        </div>

        {/* Wykres miesięczny */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">Progresja miesięczna <span className="text-gray-700">— {selRYear}</span></h2>
          <MonthlyChart data={monthlyData} year={selRYear} metric={chartMetric} />
          <TopEfforts year={selRYear} />
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
