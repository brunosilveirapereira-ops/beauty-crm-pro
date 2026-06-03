import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const protectedRoutes = ["/dashboard", "/clientes", "/servicos"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isDevMode = process.env.DEV_MODE === "true";

  if (isDevMode) return response;

  if (!supabaseUrl || !supabaseKey) return response;

  const shouldProtect = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  if (!shouldProtect) return response;

  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/clientes/:path*", "/servicos/:path*"]
};
