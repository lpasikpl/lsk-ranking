import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { RankingEntry, User } from "@/types/database";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import RankingHeader from "@/components/RankingHeader";
import PeriodNav from "@/components/PeriodNav";
import Top3Table from "@/components/Top3Table";
import RankingTable from "@/components/RankingTable";
import Footer from "@/components/Footer";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    year?: string;
    month?: string;
  }>;
}

async function getCurrentUser(userId: string | undefined) {
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, profile_medium, is_admin, is_active")
    .eq("id", userId)
    .single();
  return data;
}

async function getRankingData(
  period: "month" | "year",
  year: number,
  month: number
): Promise<RankingEntry[]> {
  const supabase = createServiceClient();
  const date = new Date(year, month - 1, 1);

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
    console.error("Ranking error:", error);
    return [];
  }

  return (data as RankingEntry[]) || [];
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;

  const period = (params.period === "year" ? "year" : "month") as "month" | "year";
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const [user, rankingData] = await Promise.all([
    getCurrentUser(userId),
    getRankingData(period, year, month),
  ]);

  const title = period === "month" ? "RANKING MIESIĄCA" : `RANKING ${year}`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RankingHeader title={title} user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Nawigacja periodu */}
        <div className="flex justify-center mb-8">
          <PeriodNav period={period} year={year} month={month} />
        </div>

        {/* Sekcja Top 3 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Top 3</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Top3Table
              title="Dystans"
              entries={rankingData}
              metric="distance"
            />
            <Top3Table
              title="Przewyż."
              entries={rankingData}
              metric="elevation"
            />
            <Top3Table
              title="Czas"
              entries={rankingData}
              metric="time"
            />
          </div>
        </section>

        {/* Pełny ranking dystansu */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Ranking dystansu
          </h2>
          <RankingTable entries={rankingData} />
        </section>

        {/* CTA logowania dla niezalogowanych */}
        {!user && (
          <div className="mt-8 p-6 bg-orange-50 border border-orange-100 rounded-xl text-center">
            <p className="text-gray-700 mb-3 font-medium">
              Chcesz dołączyć do rankingu?
            </p>
            <a
              href="/api/auth/strava"
              className="inline-flex items-center gap-2 bg-strava text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
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
