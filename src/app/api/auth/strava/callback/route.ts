import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/strava";
import { createServiceClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/lib/strava";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/login?error=strava_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/login?error=no_code`
    );
  }

  try {
    // Wymień code na tokeny
    const tokenData = await exchangeCodeForTokens(code);
    const athlete = tokenData.athlete;

    if (!athlete) {
      return NextResponse.redirect(
        `${appUrl}/login?error=no_athlete`
      );
    }

    const supabase = createServiceClient();

    // Sprawdź czy użytkownik już istnieje (po strava_id)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("strava_id", athlete.id)
      .single();

    let userId: string;

    if (existingUser) {
      // Aktualizuj dane użytkownika
      userId = existingUser.id;
      await supabase
        .from("users")
        .update({
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          profile_medium: athlete.profile_medium,
          profile: athlete.profile,
          city: athlete.city,
          country: athlete.country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      // Utwórz nowego użytkownika
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          strava_id: athlete.id,
          username: athlete.username,
          firstname: athlete.firstname,
          lastname: athlete.lastname,
          profile_medium: athlete.profile_medium,
          profile: athlete.profile,
          city: athlete.city,
          country: athlete.country,
          is_active: true,
          is_admin: false,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        console.error("Failed to create user:", createError);
        return NextResponse.redirect(
          `${appUrl}/login?error=create_user_failed`
        );
      }

      userId = newUser.id;
    }

    // Zapisz/aktualizuj tokeny Strava
    await supabase.from("strava_tokens").upsert(
      {
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Utwórz sesję Supabase Auth (używamy custom session przez cookie)
    // Zapisujemy userId w cookie do autoryzacji
    const response = NextResponse.redirect(`${appUrl}/`);

    // Ustawiamy cookie z user_id (zaszyfrowane lub jako JWT)
    response.cookies.set("lsk_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dni
      path: "/",
    });

    // Zapisz też strava_id do cookie (do wyświetlania linków)
    response.cookies.set("lsk_strava_id", athlete.id.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    // Synchronizuj aktywności w tle (nie czekamy)
    syncUserActivities(userId).catch(console.error);

    return response;
  } catch (err) {
    console.error("Strava callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/login?error=callback_failed`
    );
  }
}
