import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDistance, formatTime, getCountryFlag, formatNumber } from "@/lib/format";
import { startOfYear, endOfYear } from "date-fns";
import MonthlyChart from "@/components/MonthlyChart";
import Footer from "@/components/Footer";

interface PageProps {
  params: Promise<{ userId: string }>;
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
  const { user, year2025, year, monthly } = await getAthleteData(userId);

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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">
                {user.firstname} {user.lastname}
              </h1>
              {getCountryFlag(user.country) && (
                <span className="text-xl">{getCountryFlag(user.country)}</span>
              )}
            </div>
            {user.city && (
              <p className="text-gray-500 text-sm mt-0.5">{user.city}</p>
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
                  <div className="text-xs text-gray-600 mt-0.5">{item.unit}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{item.name}</div>
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
