import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isSupabaseAuthEnabled } from "@/lib/auth-config";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function normalizeHostRedirect(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase();

  if (host === "www.app.webcoinlabs.com") {
    return NextResponse.redirect(new URL(`https://app.webcoinlabs.com${pathname}${request.nextUrl.search}`));
  }

  if (host === "app.webcoinlabs.com" && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((host === "webcoinlabs.com" || host === "www.webcoinlabs.com") && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL(`https://app.webcoinlabs.com${pathname}${request.nextUrl.search}`));
  }

  return null;
}

function requiresProtectedSession(pathname: string) {
  return pathname.startsWith("/app") || pathname.startsWith("/api/profiles/contact");
}

export default async function middleware(request: NextRequest) {
  const hostRedirect = normalizeHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const pathname = request.nextUrl.pathname;

  if (isSupabaseAuthEnabled) {
    const { response, user } = await updateSupabaseSession(request);

    if (requiresProtectedSession(pathname) && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const token = await getToken({ req: request });
  if (requiresProtectedSession(pathname) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/profiles/contact/:path*", "/login/:path*", "/auth/callback"],
};
