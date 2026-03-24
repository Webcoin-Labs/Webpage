import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;
        const host = (req.headers.get("host") ?? "").toLowerCase();

        // Keep marketing site on apex domain, but auth UI on app subdomain.
        if ((host === "webcoinlabs.com" || host === "www.webcoinlabs.com") && pathname.startsWith("/login")) {
            const target = new URL(`https://app.webcoinlabs.com${pathname}${req.nextUrl.search}`);
            return NextResponse.redirect(target);
        }

        // Admin-only routes
        if (pathname.startsWith("/app/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/app", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Require auth for all /app/* routes
                if (req.nextUrl.pathname.startsWith("/app")) {
                    return !!token;
                }
                if (req.nextUrl.pathname.startsWith("/api/profiles/contact")) {
                    return !!token && (token.role === "INVESTOR" || token.role === "ADMIN");
                }
                return true;
            },
        },
    }
);

export const config = {
    matcher: ["/app/:path*", "/api/profiles/contact/:path*", "/login/:path*"],
};
