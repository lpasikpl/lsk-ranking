import { NextResponse } from "next/server";

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  const response = NextResponse.redirect(`${appUrl}/login`);

  response.cookies.delete("lsk_user_id");
  response.cookies.delete("lsk_strava_id");

  return response;
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  const response = NextResponse.redirect(`${appUrl}/login`);

  response.cookies.delete("lsk_user_id");
  response.cookies.delete("lsk_strava_id");

  return response;
}
