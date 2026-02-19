import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString());
  const userId = request.nextUrl.searchParams.get("userId");

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("get_monthly_stats", {
    p_year: year,
    p_user_id: userId || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
