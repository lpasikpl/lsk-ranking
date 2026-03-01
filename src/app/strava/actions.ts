"use server";

import { revalidatePath } from "next/cache";

export async function revalidateStrava() {
  revalidatePath("/strava");
}
