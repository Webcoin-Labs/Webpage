import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Brand colors
                navy: {
                    950: "#030712",
                    900: "#0a0f1e",
                    800: "#0d1529",
                    700: "#111c3a",
                    600: "#16244d",
                },
                cyan: {
                    400: "#22d3ee",
                    500: "#06b6d4",
                    600: "#0891b2",
                },
                violet: {
                    400: "#a78bfa",
                    500: "#8b5cf6",
                    600: "#7c3aed",
                },
                gold: {
                    400: "#fbbf24",
                    500: "#f59e0b",
                },
            },
            boxShadow: {
                "soft": "0 8px 30px rgba(0, 0, 0, 0.04)",
                "soft-hover": "0 12px 40px rgba(0, 0, 0, 0.08)",
                "glass": "0 4px 20px rgba(0, 0, 0, 0.03)",
                "glass-hover": "0 8px 30px rgba(0, 0, 0, 0.06)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ["var(--font-sans)", "system-ui", "sans-serif"],
                mono: [
                    "var(--font-mono)",
                    "ui-monospace",
                    "SFMono-Regular",
                    "Menlo",
                    "monospace",
                ],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "fade-in": {
                    from: { opacity: "0", transform: "translateY(20px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(34,211,238,0.3)" },
                    "50%": { boxShadow: "0 0 60px rgba(34,211,238,0.6)" },
                },
                "gradient-shift": {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.6s ease-out",
                "float": "float 6s ease-in-out infinite",
                "pulse-glow": "pulse-glow 3s ease-in-out infinite",
                "gradient-shift": "gradient-shift 6s ease infinite",
            },
            backgroundSize: {
                "300%": "300%",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
