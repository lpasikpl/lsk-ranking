// Lista treningów z analizą FIT
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import RankingHeader from "@/components/RankingHeader";
import Footer from "@/components/Footer";
import ActivityList from "@/components/analiza/ActivityList";

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

export default async function AnalizaPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  const user = await getUser(userId);

  if (!user?.is_admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d0d0d" }}>
      <RankingHeader title="LSK Ranking" subtitle="Analiza treningow" user={user} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#fff" }}>Treningi</h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Kliknij na trening aby zobaczyc szczegolowa analize
            </p>
          </div>
          <Link
            href="/analiza/trendy"
            style={{
              background: "rgba(33,150,243,0.15)",
              border: "1px solid rgba(33,150,243,0.3)",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#2196F3",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            📈 Analiza trendów
          </Link>
        </div>

        <div
          className="rounded-xl p-1"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ActivityList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
