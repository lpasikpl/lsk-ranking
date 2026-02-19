import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "month";
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  const now = new Date();
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth();

  const date = new Date(year, month, 1);

  let startDate: Date;
  let endDate: Date;

  if (period === "month") {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
  } else {
    startDate = startOfYear(date);
    endDate = endOfYear(date);
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("get_ranking", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
