import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CalendlyProvider } from "@/components/providers/CalendlyProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://webcoinlabs.com"),
    title: {
        default: "Webcoin Labs 2.0 — Builder-First Innovation Hub",
        template: "%s | Webcoin Labs",
    },
    description:
        "Formerly Webcoin Capital. Rebuilt for the new era: infrastructure, programs, and support for builders and founders in Web3.",
    keywords: [
        "web3",
        "blockchain",
        "builder programs",
        "founder support",
        "ecosystem partnerships",
        "innovation hub",
        "venture studio",
    ],
    authors: [{ name: "Webcoin Labs" }],
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://webcoinlabs.com",
        siteName: "Webcoin Labs",
        title: "Webcoin Labs 2.0 — Builder-First Innovation Hub",
        description:
            "Formerly Webcoin Capital. Rebuilt for the new era: infrastructure, programs, and support for builders and founders in Web3.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Webcoin Labs 2.0",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Webcoin Labs 2.0 — Builder-First Innovation Hub",
        description:
            "Formerly Webcoin Capital. Rebuilt for the new era.",
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
            <body className={inter.className}>
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
            </body>
        </html>
    );
}
