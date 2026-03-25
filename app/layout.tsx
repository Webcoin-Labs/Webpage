import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CalendlyProvider } from "@/components/providers/CalendlyProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SpeedInsights } from "@vercel/speed-insights/next";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://webcoinlabs.com"),
    title: {
        default: "Webcoin Labs - Blockchain founder-builder network",
        template: "%s | Webcoin Labs",
    },
    description:
        "Webcoin Labs connects founders and builders, accelerates product development, and delivers funding readiness with AI-powered analysis and ecosystem access.",
    keywords: [
        "web3",
        "blockchain",
        "builder ecosystem",
        "founder support",
        "ecosystem partnerships",
        "token launch",
        "growth",
    ],
    authors: [{ name: "Webcoin Labs" }],
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://webcoinlabs.com",
        siteName: "Webcoin Labs",
        title: "Webcoin Labs - Blockchain founder-builder network",
        description:
            "Webcoin Labs connects founders and builders, accelerates product development, and delivers funding readiness with AI-powered analysis and ecosystem access.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Webcoin Labs",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Webcoin Labs - Blockchain founder-builder network",
        description:
            "Webcoin Labs connects founders and builders, accelerates product development, and delivers funding readiness with AI-powered analysis and ecosystem access.",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${spaceGrotesk.variable} ${plexMono.variable} font-sans`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider session={session}>
                        <CalendlyProvider>{children}</CalendlyProvider>
                    </AuthProvider>
                </ThemeProvider>
                <SpeedInsights />
            </body>
        </html>
    );
}
