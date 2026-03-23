// Szczegoly treningu z dashboardem analitycznym
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import RankingHeader from "@/components/RankingHeader";
import Footer from "@/components/Footer";
import RideDashboard from "@/components/analiza/RideDashboard";
import Link from "next/link";

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

async function getActivityData(activityId: number) {
  const supabase = createServiceClient();

  const [actRes, fitRes, lapsRes, recordsRes, gearRes, commentsRes, settingsRes] =
    await Promise.all([
      supabase.from("activities").select("*").eq("id", activityId).single(),
      supabase.from("fit_activities").select("*").eq("activity_id", activityId).maybeSingle(),
      supabase.from("fit_laps").select("*").eq("activity_id", activityId).order("lap_number"),
      supabase.from("fit_records").select("seconds_offset,latitude,longitude,altitude,power,heart_rate,cadence,speed,temperature,left_torque_effectiveness,left_pedal_smoothness").eq("activity_id", activityId).order("seconds_offset"),
      supabase.from("fit_gear_events").select("*").eq("activity_id", activityId).order("seconds_offset"),
      supabase.from("ai_comments").select("section,comment,created_at").eq("activity_id", activityId),
      supabase.from("athlete_settings").select("ftp,max_hr,resting_hr,power_zone_1_max,power_zone_2_max,power_zone_3_max,power_zone_4_max,power_zone_5_max,power_zone_6_max").maybeSingle(),
    ]);

  return {
    activity: actRes.data,
    fitData: fitRes.data ?? null,
    laps: lapsRes.data ?? [],
    records: recordsRes.data ?? [],
    gearEvents: gearRes.data ?? [],
    aiComments: commentsRes.data ?? [],
    athleteSettings: settingsRes.data ?? null,
  };
}

export default async function AnalizaActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activityId = parseInt(id, 10);

  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  const user = await getUser(userId);

  if (!user?.is_admin) {
    redirect("/");
  }

  if (isNaN(activityId)) notFound();

  const data = await getActivityData(activityId);
  if (!data.activity) notFound();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d0d0d" }}>
      <RankingHeader title="LSK Ranking" subtitle="Analiza treningu" user={user} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Powrot do listy */}
        <Link
          href="/analiza"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-orange-400"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          ← Powrot do listy
        </Link>

        <RideDashboard
          activity={data.activity}
          fitData={data.fitData}
          laps={data.laps}
          records={data.records}
          gearEvents={data.gearEvents}
          aiComments={data.aiComments}
          athleteSettings={data.athleteSettings}
        />
      </main>
      <Footer />
    </div>
  );
}
