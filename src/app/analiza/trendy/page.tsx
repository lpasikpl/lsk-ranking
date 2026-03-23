// Analiza trendów treningowych (admin only)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchRecentActivities,
  fetchTrainingLoad,
  fetchWeeklySummaries,
} from "@/lib/strava-queries";
import TrendyDashboard from "@/components/analiza/TrendyDashboard";
import RankingHeader from "@/components/RankingHeader";
import Footer from "@/components/Footer";

async function getUser(userId: string | undefined) {
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, profile_medium, is_admin")
    .eq("id", userId)
    .single();
  return data;
}

export default async function TrendyPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  const user = await getUser(userId);

  if (!user?.is_admin) {
    redirect("/");
  }

  const [activities2026, activities2025, trainingLoad, weeklySummaries] = await Promise.all([
    fetchRecentActivities(2026),
    fetchRecentActivities(2025),
    fetchTrainingLoad(),
    fetchWeeklySummaries(),
  ]);

  const filtered2026 = activities2026.filter((a) => a.distance_meters >= 10000);
  const filtered2025 = activities2025.filter((a) => a.distance_meters >= 10000);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d0d0d" }}>
      <RankingHeader title="LSK Ranking" subtitle="Analiza trendow" user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#fff" }}>Analiza trendów</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Treningi ≥10 km | {filtered2026.length} jazd w 2026 · {filtered2025.length} w 2025
            </p>
          </div>
          <Link href="/analiza" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            ← Lista treningów
          </Link>
        </div>
        <TrendyDashboard
          activities2026={filtered2026}
          activities2025={filtered2025}
          trainingLoad={trainingLoad}
          weeklySummaries={weeklySummaries}
        />
      </main>
      <Footer />
    </div>
  );
}
