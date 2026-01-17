import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // --- CORRECCIÓN AQUÍ ---
  // Quitamos '/update-password' de esta lista.
  // Ahora es una ruta protegida (requiere sesión), pero el link mágico ya nos da esa sesión.
  const publicRoutes = ["/login", "/forgot-password", "/auth/callback"];

  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // 1. Protección de rutas privadas: Si no hay usuario y no es pública -> Login
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirección de usuarios logueados:
  // Si ya tiene sesión y trata de entrar a Login o Recuperar -> Dashboard
  // NOTA: Como quitamos update-password de arriba, esta lógica ya no te expulsará de ahí.
  if (user && isPublicRoute && path !== "/auth/callback") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
