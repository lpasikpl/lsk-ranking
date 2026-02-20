import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

interface AdminUser {
  id: string;
  strava_id: number;
  firstname: string | null;
  lastname: string | null;
  is_admin: boolean;
}

async function getAdminUser(userId: string | undefined): Promise<AdminUser | null> {
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, is_admin")
    .eq("id", userId)
    .single();
  return data as AdminUser | null;
}

async function getAllUsers() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, profile_medium, is_active, is_admin, created_at, updated_at")
    .order("created_at", { ascending: false });
  return data || [];
}

async function getRecentSyncLogs() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("sync_logs")
    .select("*, users(firstname, lastname)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

async function getBestEffortsSummary() {
  const supabase = createServiceClient();
  // Pobierz wszystkie rekordy (do 10000) i agreguj w JS
  const { data } = await supabase
    .from("lsk_best_efforts")
    .select(`
      effort_name, moving_time,
      users!inner(id, firstname, lastname)
    `)
    .limit(10000);

  if (!data) return [];

  // Grupuj per user+dystans: najlepszy czas + liczba
  const grouped: Record<string, {
    user_id: string;
    firstname: string | null;
    lastname: string | null;
    effort_name: string;
    best_time: number;
    count: number;
  }> = {};

  for (const row of data as any[]) {
    const key = `${row.users.id}_${row.effort_name}`;
    if (!grouped[key]) {
      grouped[key] = {
        user_id: row.users.id,
        firstname: row.users.firstname,
        lastname: row.users.lastname,
        effort_name: row.effort_name,
        best_time: row.moving_time,
        count: 1,
      };
    } else {
      grouped[key].count++;
      if (row.moving_time < grouped[key].best_time) grouped[key].best_time = row.moving_time;
    }
  }

  return Object.values(grouped).sort((a, b) =>
    a.effort_name.localeCompare(b.effort_name) || a.best_time - b.best_time
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;

  const adminUser = await getAdminUser(userId);

  if (!adminUser || !adminUser.is_admin) {
    redirect("/");
  }

  const [users, syncLogs, bestEfforts] = await Promise.all([
    getAllUsers(),
    getRecentSyncLogs(),
    getBestEffortsSummary(),
  ]);

  return (
    <AdminClient
      adminUser={adminUser}
      initialUsers={users}
      syncLogs={syncLogs}
      bestEfforts={bestEfforts}
    />
  );
}
