// Endpoint do przyjmowania komentarzy AI od n8n
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const VALID_SECTIONS = ["overview", "decoupling", "quadrant", "gears", "pedaling", "summary"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const activityId = parseInt(id, 10);

  // Weryfikacja sekretu
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== (process.env.N8N_WEBHOOK_SECRET ?? "").trim()) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const body = await req.json();
  const comments: Array<{ section: string; comment: string }> = body.comments ?? [];

  if (!Array.isArray(comments) || comments.length === 0) {
    return NextResponse.json({ error: "Brak komentarzy" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Filtruj poprawne sekcje
  const validComments = comments.filter(c =>
    VALID_SECTIONS.includes(c.section) && typeof c.comment === "string" && c.comment.length > 0
  );

  // Upsert komentarzy
  const { error } = await supabase.from("ai_comments").upsert(
    validComments.map(c => ({
      activity_id: activityId,
      section: c.section,
      comment: c.comment,
      created_at: new Date().toISOString(),
    })),
    { onConflict: "activity_id,section" }
  );

  if (error) {
    console.error("Blad zapisu komentarzy AI:", error);
    return NextResponse.json({ error: "Blad zapisu" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: validComments.length });
}
