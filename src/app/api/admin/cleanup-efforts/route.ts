import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count, error } = await supabase
    .from("lsk_best_efforts")
    .delete({ count: "exact" })
    .lt("activity_date", "2025-01-01");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, deleted: count });
}
