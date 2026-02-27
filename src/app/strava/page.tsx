import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

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

export default async function StravaPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  const user = await getAdminUser(userId);

  if (!user || !user.is_admin) {
    redirect("/");
  }

  return (
    <div className="w-full h-screen">
      <iframe
        src="https://strava-dashboard-beta-ten.vercel.app"
        className="w-full h-full border-0"
        title="Strava Dashboard"
      />
    </div>
  );
}
