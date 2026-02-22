import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDistance, formatTime, getCountryFlag, formatNumber } from "@/lib/format";
import { startOfYear, endOfYear } from "date-fns";
import MonthlyChart from "@/components/MonthlyChart";
import Footer from "@/components/Footer";
import RankBadge from "@/components/RankBadge";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const EFFORT_DISTANCES = ["10 km", "20 km", "30 km", "40 km", "50 km", "100 km"] as const;

async function getAthleteBadges(userId: string) {
  const supabase = createServiceClient();
  const startDate = startOfYear(new Date()).toISOString();
  const endDate = endOfYear(new Date()).toISOString();

  const [rankingRes, ...effortResults] = await Promise.all([
    supabase.rpc("get_ranking", { p_start_date: startDate, p_end_date: endDate }),
    ...EFFORT_DISTANCES.map(dist =>
      supabase
        .from("lsk_best_efforts")
        .select("moving_time, users!inner(id, is_active)")
        .eq("effort_name", dist)
        .eq("users.is_active", true)
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("moving_time", { ascending: true })
        .limit(1000)
    ),
  ]);

  const ranking: any[] = rankingRes.data || [];
  const distIdx = ranking.findIndex(e => e.user_id === userId);
  const elevIdx = [...ranking].sort((a, b) => b.total_elevation - a.total_elevation).findIndex(e => e.user_id === userId);
  const timeIdx = [...ranking].sort((a, b) => b.total_time - a.total_time).findIndex(e => e.user_id === userId);

  const rankingPositions = [
    { label: "Dystans", position: distIdx >= 0 ? distIdx + 1 : 0 },
    { label: "m↑", position: elevIdx >= 0 ? elevIdx + 1 : 0 },
    { label: "Czas", position: timeIdx >= 0 ? timeIdx + 1 : 0 },
  ].filter(b => b.position > 0);

  const effortPositions: { label: string; position: number }[] = [];
  EFFORT_DISTANCES.forEach((dist, i) => {
    const data: any[] = (effortResults[i].data as any[]) || [];
    const seen = new Set<string>();
    const deduped = data.filter(r => {
      if (seen.has(r.users.id)) return false;
      seen.add(r.users.id);
      return true;
    });
    const pos = deduped.findIndex(r => r.users.id === userId);
    if (pos >= 0) effortPositions.push({ label: dist, position: pos + 1 });
  });

  return { rankingPositions, effortPositions };
}

async function getAthleteData(userId: string) {
  const supabase = createServiceClient();

  const [userRes, year2025Res, yearRes, monthlyRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.rpc("get_athlete_stats", { p_user_id: userId, p_start_date: "2025-01-01T00:00:00Z", p_end_date: "2025-12-31T23:59:59Z" }),
    supabase.rpc("get_athlete_stats", {
      p_user_id: userId,
      p_start_date: startOfYear(new Date()).toISOString(),
      p_end_date: endOfYear(new Date()).toISOString(),
    }),
    supabase.rpc("get_monthly_stats", { p_year: new Date().getFullYear(), p_user_id: userId }),
  ]);

  return {
    user: userRes.data,
    year2025: year2025Res.data?.[0] || null,
    year: yearRes.data?.[0] || null,
    monthly: monthlyRes.data || [],
  };
}

export default async function AthletePage({ params }: PageProps) {
  const { userId } = await params;
  const [{ user, year2025, year, monthly }, badges] = await Promise.all([
    getAthleteData(userId),
    getAthleteBadges(userId),
  ]);

  if (!user) notFound();

  const currentYear = new Date().getFullYear();

  const stats = [
    {
      label: "Ten rok",
      items: [
        { name: "Dystans", value: formatDistance(year?.total_distance || 0), unit: "km" },
        { name: "Przewyższenie", value: formatNumber(year?.total_elevation || 0), unit: "m" },
        { name: "Czas", value: formatTime(year?.total_time || 0), unit: "h" },
        { name: "Aktywne dni", value: formatNumber(year?.active_days || 0), unit: "dni" },
      ],
    },
    {
      label: "2025",
      items: [
        { name: "Dystans", value: formatDistance(year2025?.total_distance || 0), unit: "km" },
        { name: "Przewyższenie", value: formatNumber(year2025?.total_elevation || 0), unit: "m" },
        { name: "Czas", value: formatTime(year2025?.total_time || 0), unit: "h" },
        { name: "Aktywne dni", value: formatNumber(year2025?.active_days || 0), unit: "dni" },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            ← Ranking
          </Link>
          <a
            href={`https://www.strava.com/athletes/${user.strava_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
          >
            Zobacz na Stravie ↗
          </a>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
          {user.profile_medium ? (
            <Image
              src={user.profile_medium}
              alt={`${user.firstname}`}
              width={72}
              height={72}
              className="rounded-full ring-2 ring-orange-500/20 flex-shrink-0"
            />
          ) : (
            <div className="w-18 h-18 rounded-full bg-white/5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {user.firstname} {user.lastname}
              </h1>
              {getCountryFlag(user.country) && (
                <span className="text-xl">{getCountryFlag(user.country)}</span>
              )}
            </div>
            {user.city && (
              <p className="text-gray-400 text-sm mt-0.5">{user.city}</p>
            )}
            {(badges.rankingPositions.length > 0 || badges.effortPositions.length > 0) && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap gap-x-5 gap-y-2">
                {badges.rankingPositions.filter(b => b.label === "Dystans").length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider whitespace-nowrap">Ranking {currentYear}</span>
                    <div className="flex gap-2">
                      {badges.rankingPositions.filter(b => b.label === "Dystans").map(b => (
                        <div key={b.label} className="flex flex-col items-center gap-0.5">
                          <RankBadge position={b.position} showTrophyFrom={2} />
                          <span className="text-[10px] text-gray-600">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {badges.effortPositions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider whitespace-nowrap">Top prędkości {currentYear}</span>
                    <div className="flex gap-2">
                      {badges.effortPositions.map(b => (
                        <div key={b.label} className="flex flex-col items-center gap-0.5">
                          <RankBadge position={b.position} showTrophyFrom={2} />
                          <span className="text-[10px] text-gray-600">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats grids */}
        {stats.map((section) => (
          <div key={section.label} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
              {section.label}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {section.items.map((item) => (
                <div key={item.name} className="glass rounded-xl p-4">
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.unit}</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Monthly chart */}
        <MonthlyChart
          data={monthly}
          year={currentYear}
          metric="distance"
        />
      </main>

      <Footer />
    </div>
  );
}
