import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run Supabase session sync and get authentication status
  const { supabaseResponse, isAuthenticated } = await updateSession(request);

  // Check if route is part of protected dashboard
  const isDashboardPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/referral") ||
    pathname.startsWith("/pendaftaran") ||
    pathname.startsWith("/komisi") ||
    pathname.startsWith("/paket") ||
    pathname.startsWith("/hotels") ||
    pathname.startsWith("/hotel") ||
    pathname.startsWith("/airlines") ||
    pathname.startsWith("/maskapai") ||
    pathname.startsWith("/rekening-bank") ||
    pathname.startsWith("/bank") ||
    pathname.startsWith("/mitra-agen") ||
    pathname.startsWith("/muthawif") ||
    pathname.startsWith("/data-jamaah") ||
    pathname.startsWith("/dokumen-paspor") ||
    pathname.startsWith("/tagihan-kasir") ||
    pathname.startsWith("/perlengkapan") ||
    pathname.startsWith("/perlengkapan-jamaah") ||
    pathname.startsWith("/equipment") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/pengumuman") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/jamaah-bimbingan") ||
    pathname.startsWith("/manasik") ||
    pathname.startsWith("/manifest");

  const isAuthPath = pathname.startsWith("/login");

  // Protect dashboard routes: redirect to login if unauthenticated
  if (isDashboardPath && !isAuthenticated) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if already authenticated and accessing login
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons, svg (public static assets)
     * - api routes (e.g. /api/health)
     * - auth callback (handled by app/auth/callback/route.ts)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons|fonts|api/health|auth/callback).*)",
  ],
};
