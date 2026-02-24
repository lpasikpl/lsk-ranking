import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { User } from "@/types/database";
import RankingHeader from "@/components/RankingHeader";
import Footer from "@/components/Footer";
import RywalizacjaClient from "@/components/RywalizacjaClient";
import { getSeasonData } from "@/lib/competition";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
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

export default async function RywalizacjaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;

  if (!userId) redirect("/");

  const now = new Date();
  const currentYear = now.getFullYear();
  const selectedYear = params.year ? parseInt(params.year) : currentYear;

  const [user, seasonData] = await Promise.all([
    getCurrentUser(userId),
    getSeasonData(selectedYear),
  ]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <RankingHeader title="LSK Ranking" subtitle="Kolarstwo" user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <RywalizacjaClient
          data={JSON.parse(JSON.stringify(seasonData))}
          currentYear={currentYear}
          selectedYear={selectedYear}
        />
      </main>

      <Footer />
    </div>
  );
}
