import { NextResponse, type NextRequest } from "next/server";

// Prosta ochrona panelu admin - sprawdza cookie lsk_user_id
// Główna logika auth (is_admin check) jest w src/app/admin/page.tsx
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const userId = request.cookies.get("lsk_user_id")?.value;
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
