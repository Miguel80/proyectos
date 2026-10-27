import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/** Rutas que exigen sesión. El control definitivo está además en RLS y en cada página. */
const PROTECTED_PREFIXES = ["/bitacora"];

function redirectTo(request: NextRequest, pathname: string, source: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);
  // Conserva las cookies de sesión refrescadas.
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/** Refresca la sesión de Supabase en cada request, propaga las cookies y protege rutas privadas. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    console.warn("[middleware] Supabase no configurado: se omite el refresco de sesión.");
    return response;
  }

  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // No insertar lógica entre createServerClient y getUser(): valida el JWT contra Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) return redirectTo(request, "/login", response);
  if (user && pathname === "/login") return redirectTo(request, "/bitacora", response);

  return response;
}
