import { createServiceClient } from "@/lib/supabase/server";
import RecentActivitiesList from "@/components/RecentActivitiesList";

interface RecentActivitiesProps {
  year: number;
  month: number;
}

async function getRecentActivities(year: number, month: number) {
  const supabase = createServiceClient();
  const pad = (n: number) => String(n).padStart(2, "0");
  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = `${year}-${pad(month)}-01T00:00:00`;
  const endDate = `${year}-${pad(month)}-${pad(daysInMonth)}T23:59:59`;

  const { data } = await supabase
    .from("lsk_activities")
    .select(`
      strava_id, name, type, trainer, distance, moving_time, total_elevation_gain, start_date_local,
      users!inner(id, firstname, lastname, profile_medium, is_active)
    `)
    .eq("users.is_active", true)
    .gte("start_date_local", startDate)
    .lte("start_date_local", endDate)
    .order("start_date_local", { ascending: false })
    .limit(100);

  return (data || []) as any[];
}

export default async function RecentActivities({ year, month }: RecentActivitiesProps) {
  const activities = await getRecentActivities(year, month);

  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Ostatnie aktywności
      </h2>
      <RecentActivitiesList activities={activities} />
    </div>
  );
}
