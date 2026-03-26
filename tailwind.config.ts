import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class", "[data-theme='dark']"],
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
                /* Brand palette — deep purple command center */
                purple: {
                    50: "#faf5ff",
                    100: "#f3e8ff",
                    200: "#e9d5ff",
                    300: "#d8b4fe",
                    400: "#c084fc",
                    500: "#a855f7",
                    600: "#9333ea",
                    700: "#7c3aed",
                    800: "#6d28d9",
                    900: "#5b21b6",
                    950: "#1a0f35",
                },
                violet: {
                    400: "#a78bfa",
                    500: "#8b5cf6",
                    600: "#7c3aed",
                    700: "#6d28d9",
                },
                emerald: {
                    300: "#6ee7b7",
                    400: "#34d399",
                    500: "#22c55e",
                },
                amber: {
                    300: "#fcd34d",
                    400: "#fbbf24",
                    500: "#f59e0b",
                },
                rose: {
                    400: "#fb7185",
                    500: "#ef4444",
                },
                cyan: {
                    300: "#67e8f9",
                    400: "#22d3ee",
                    500: "#06b6d4",
                },
            },
            boxShadow: {
                "soft": "0 8px 30px rgba(0, 0, 0, 0.12)",
                "soft-hover": "0 12px 40px rgba(0, 0, 0, 0.18)",
                "glass": "0 4px 20px rgba(0, 0, 0, 0.08)",
                "glass-hover": "0 8px 30px rgba(0, 0, 0, 0.12)",
                "glow-purple": "0 0 24px rgba(124, 58, 237, 0.12)",
                "glow-purple-lg": "0 0 48px rgba(124, 58, 237, 0.18)",
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
                    "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.2)" },
                    "50%": { boxShadow: "0 0 48px rgba(124,58,237,0.35)" },
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
