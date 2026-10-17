import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isStaffRole } from "@/lib/auth/roles";

/**
 * Halaman tanpa login. Selain dari daftar ini, setiap route halaman butuh sesi
 * Supabase Auth yang valid.
 */
const PUBLIC_PAGES = [
  "/",
  "/login",
  "/auth/callback",
  "/pembayaran-sukses",
  "/pembayaran-pending",
  "/pembayaran-gagal",
];

/**
 * Area khusus staf. Jamaah/agen/muthawif yang membuka alamat ini dikirim kembali
 * ke dashboard peran mereka sendiri.
 */
const STAFF_ONLY_PATHS = [
  "/super-admin",
  "/admin",
  "/pengguna",
  "/users",
  "/activity-logs",
  "/dashboard/users",
  "/dashboard/activity-logs",
  "/kelola-cabang",
  "/cabang",
  "/pengaturan-sistem",
  "/white-label",
  "/rekening-bank",
  "/bank",
  "/tagihan-kasir",
  "/komisi-agen",
];

function matches(pathname: string, list: string[]): boolean {
  return list.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Route handler API memeriksa dan memperbarui sesinya sendiri (requireSession)
  // supaya kegagalan membalas JSON 401, bukan redirect HTML.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { supabaseResponse, session } = await updateSession(request);

  if (matches(pathname, PUBLIC_PAGES)) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL(session.homePath, request.url));
    }
    return supabaseResponse;
  }

  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (matches(pathname, STAFF_ONLY_PATHS) && !isStaffRole(session.role)) {
    return NextResponse.redirect(new URL(session.homePath, request.url));
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
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons|fonts).*)",
  ],
};
