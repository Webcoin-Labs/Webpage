/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            "lh3.googleusercontent.com",
            "avatars.githubusercontent.com",
            "res.cloudinary.com",
        ],
    },
    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000", "webcoinlabs.com", "app.webcoinlabs.com"],
        },
    },
    async headers() {
        const isProd = process.env.NODE_ENV === "production";
        // NOTE: CSP is intentionally pragmatic for Next.js + Tailwind (inline styles) + Calendly embeds.
        // If you later add analytics/widgets, add their domains explicitly here.
        const csp = [
            "default-src 'self'",
            // Next.js/Tailwind + Google Fonts (globals.css @import). Blocking fonts can break initial render.
            "style-src 'self' 'unsafe-inline' https://assets.calendly.com https://fonts.googleapis.com",
            // Next.js may inline small scripts; Calendly uses scripts from assets.calendly.com.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://assets.calendly.com https://calendly.com",
            // Allow images from self + data/blob + configured remote image hosts.
            "img-src 'self' data: blob: https: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://res.cloudinary.com",
            "font-src 'self' data: https://fonts.gstatic.com",
            // Calendly iframe + any other embedded frames must be allowed explicitly.
            "frame-src 'self' https://calendly.com https://*.calendly.com",
            "connect-src 'self' https://calendly.com https://*.calendly.com https://assets.calendly.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            // Clickjacking protection: only allow your own origin to frame pages.
            "frame-ancestors 'self'",
            ...(isProd ? ["upgrade-insecure-requests"] : []),
        ].join("; ");

        return [
            {
                source: "/(.*)",
                headers: [
                    // CSP first (browsers enforce it for scripts, frames, etc.)
                    { key: "Content-Security-Policy", value: csp },
                    // Legacy clickjacking header; CSP frame-ancestors is primary.
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    ...(isProd
                        ? [
                              // HSTS: only enable in production behind HTTPS.
                              { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
                          ]
                        : []),
                ],
            },
        ];
    },
};

export default nextConfig;
