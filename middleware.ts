import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

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
    matcher: ["/app/:path*", "/api/profiles/contact/:path*"],
};
