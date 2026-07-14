import type { Config } from "tailwindcss";

/**
 * HabeshaGram — Dark Cinematic Luxe design system
 *
 * The palette is remapped so the whole app renders as a warm, near-black
 * cinematic UI with glowing amber/gold accents:
 *  - `surface`  → deep warm black (page background)
 *  - `card`     → elevated warm coal (panels, cards)
 *  - `ink`      → warm off-white (primary text)
 *  - `brand-*`  → LOW shades are dark amber surface tints / borders,
 *                 MID shades are vivid amber (CTAs, glows),
 *                 HIGH shades are luminous gold text.
 *  - `stone-*`  → low shades are dark neutral tints, mid/high shades are
 *                 warm gray reading text on dark.
 *  - status scales (red/orange/rose/blue/sky/emerald/amber/green) follow the
 *    same rule: `*-50/100/200` are dark translucent tints + borders,
 *    `*-600/700/800` are bright, readable accent text.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#231a0d",
          100: "#2f2412",
          200: "#453317",
          300: "#5f451c",
          400: "#f0a824",
          500: "#f59e0b",
          600: "#fbb020",
          700: "#f8c55c",
          800: "#fbd88d",
          900: "#fdeac1",
          950: "#140f08"
        },
        ink: "#f4ede1",
        surface: "#0b0908",
        card: "#161210",
        elevated: "#1f1915",
        stone: {
          50: "#1a1613",
          100: "#221d18",
          200: "#2c2620",
          300: "#4a4139",
          400: "#83786b",
          500: "#a2968a",
          600: "#c0b4a6",
          700: "#d8cdbf",
          800: "#e9e0d3",
          900: "#241f1a",
          950: "#12100d"
        },
        red: {
          50: "#2a1311",
          100: "#421d19",
          200: "#5c2921",
          300: "#7d372c",
          500: "#ef4444",
          600: "#f87171",
          700: "#fca5a5",
          800: "#fecaca",
          900: "#fee2e2"
        },
        orange: {
          50: "#271710",
          100: "#3b2216",
          200: "#54301c",
          500: "#f97316",
          600: "#fb923c",
          700: "#fdba74",
          800: "#fed7aa"
        },
        rose: {
          50: "#2a1219",
          100: "#421c26",
          200: "#5c2835",
          300: "#7d3648",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#fb7185",
          700: "#fda4af"
        },
        blue: {
          50: "#111a2c",
          100: "#1a2743",
          200: "#25365c",
          300: "#33497c",
          500: "#3b82f6",
          700: "#93c5fd"
        },
        sky: {
          50: "#0e1c26",
          100: "#152a3a",
          200: "#1e3a50",
          300: "#294e6b",
          500: "#0ea5e9",
          600: "#38bdf8",
          700: "#7dd3fc"
        },
        emerald: {
          50: "#0d2019",
          100: "#143026",
          200: "#1c4234",
          500: "#10b981",
          700: "#6ee7b7",
          800: "#a7f3d0"
        },
        green: {
          400: "#4ade80",
          700: "#86efac"
        },
        amber: {
          50: "#241a0c",
          100: "#372811",
          500: "#f59e0b",
          700: "#fcd34d"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 44px rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px rgba(245, 158, 11, 0.28), 0 8px 32px rgba(0, 0, 0, 0.5)",
        "glow-sm": "0 0 14px rgba(245, 158, 11, 0.22)",
        "inner-edge": "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
      },
      backgroundImage: {
        warm: "radial-gradient(60rem 30rem at 15% -5%, rgba(245,158,11,0.09), transparent 55%), radial-gradient(50rem 26rem at 90% 0%, rgba(249,115,22,0.06), transparent 50%)",
        "gold-radial": "radial-gradient(circle at 30% 20%, rgba(245,158,11,0.16), transparent 60%)"
      },
      animation: {
        "fade-up": "fade-up 640ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 480ms ease both",
        shimmer: "shimmer 2.2s linear infinite",
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "float-slow": "float-slow 7s ease-in-out infinite"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(245,158,11,0.18)" },
          "50%": { boxShadow: "0 0 30px rgba(245,158,11,0.4)" }
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
