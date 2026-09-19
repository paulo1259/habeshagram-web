import type { Config } from "tailwindcss";

/**
 * Zema — signal-led dark interface
 *
 * Near-black ground with a cool cast, aqua as the signal colour and violet
 * reserved for AI-generated surfaces so they read as a different kind of
 * content at a glance.
 *
 *  - `surface`  → void black (page background)
 *  - `card`     → elevated panel
 *  - `ink`      → primary text
 *  - `brand-*`  → LOW shades are dark aqua tints / borders,
 *                 MID shades are the signal aqua (CTAs, meters, glows),
 *                 HIGH shades are luminous aqua text.
 *                 `brand-950` is the void, used as text ON aqua fills.
 *  - `orange-*` → remapped to the violet accent, so every existing
 *                 `from-brand-500 to-orange-500` gradient becomes aqua → violet.
 *  - `stone-*`  → cool neutrals: low shades are panel tints, mid/high shades
 *                 are reading text on dark.
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
          50: "#0b201d",
          100: "#0f2b27",
          200: "#14403a",
          300: "#1b5750",
          400: "#35cdb6",
          500: "#45e0c8",
          600: "#62e7d3",
          700: "#8bf0e0",
          800: "#b3f5ea",
          900: "#d9faf4",
          950: "#07070c"
        },
        ink: "#f2f3f7",
        surface: "#07070c",
        card: "#0e0e17",
        elevated: "#14141f",
        stone: {
          50: "#12121a",
          100: "#181822",
          200: "#20202c",
          300: "#3a3a4a",
          400: "#6e7388",
          500: "#a9adbe",
          600: "#c9ccd8",
          700: "#e2e4ec",
          800: "#f2f3f7",
          900: "#16161f",
          950: "#0b0b11"
        },
        red: {
          50: "#2a1116",
          100: "#3f181f",
          200: "#57212b",
          300: "#762d3a",
          500: "#ef4444",
          600: "#f87171",
          700: "#fca5a5",
          800: "#fecaca",
          900: "#fee2e2"
        },
        orange: {
          50: "#1a1730",
          100: "#221d3f",
          200: "#2d2653",
          500: "#7c6cf6",
          600: "#9385f8",
          700: "#a78bfa",
          800: "#c4b5fd"
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
          50: "#101827",
          100: "#17223a",
          200: "#213050",
          300: "#2d4270",
          500: "#3b82f6",
          700: "#93c5fd"
        },
        sky: {
          50: "#0c1a24",
          100: "#132738",
          200: "#1b364e",
          300: "#254869",
          500: "#0ea5e9",
          600: "#38bdf8",
          700: "#7dd3fc"
        },
        emerald: {
          50: "#0b201d",
          100: "#123029",
          200: "#194238",
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
          500: "#f0a868",
          700: "#f7c89c"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 44px rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px rgba(69, 224, 200, 0.28), 0 8px 32px rgba(0, 0, 0, 0.5)",
        "glow-sm": "0 0 14px rgba(69, 224, 200, 0.22)",
        "inner-edge": "inset 0 1px 0 rgba(255, 255, 255, 0.06)"
      },
      backgroundImage: {
        warm: "radial-gradient(60rem 30rem at 15% -5%, rgba(69,224,200,0.10), transparent 55%), radial-gradient(50rem 26rem at 90% 0%, rgba(124,108,246,0.09), transparent 50%)",
        "gold-radial": "radial-gradient(circle at 30% 20%, rgba(69,224,200,0.16), transparent 60%)"
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
          "0%, 100%": { boxShadow: "0 0 12px rgba(69,224,200,0.18)" },
          "50%": { boxShadow: "0 0 30px rgba(69,224,200,0.4)" }
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
