import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const userId = request.cookies.get("lsk_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, strava_id, firstname, lastname, profile_medium, is_admin, is_active")
    .eq("id", userId)
    .single();

  return NextResponse.json({ user });
}
