import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildSessionUser, type SessionUser } from "@/lib/auth/user";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export interface SupabaseSessionResult {
  supabaseResponse: NextResponse;
  /** Identitas dari token valid + baris profiles, atau null bila belum login. */
  session: SessionUser | null;
  isAuthenticated: boolean;
}

/**
 * Sinkronisasi token Supabase Auth dari cookie request.
 *
 * `auth.getUser()` memvalidasi access token ke server Supabase, jadi hasilnya
 * tidak bisa dipalsukan dengan menulis cookie manual seperti pada login demo
 * sebelumnya.
 */
export async function updateSession(
  request: NextRequest
): Promise<SupabaseSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabaseResponse, session: null, isAuthenticated: false };
  }

  const session = await buildSessionUser(supabase, user);
  return { supabaseResponse, session, isAuthenticated: true };
}
