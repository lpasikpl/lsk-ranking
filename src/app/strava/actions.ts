"use server";

import { revalidatePath } from "next/cache";
import { supabaseStravaService } from "@/lib/supabase-strava";
import { AVAILABLE_TAGS } from "@/lib/strava-constants";

export async function revalidateStrava() {
  revalidatePath("/strava");
}

export async function setActivityTags(activityId: number, tags: string[]) {
  const allowed = new Set<string>(AVAILABLE_TAGS as readonly string[]);
  const sanitized = Array.from(new Set(tags.filter((t) => allowed.has(t))));

  const { error } = await supabaseStravaService
    .from("activities")
    .update({ tags: sanitized })
    .eq("id", activityId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/strava");
  return { ok: true as const, tags: sanitized };
}
