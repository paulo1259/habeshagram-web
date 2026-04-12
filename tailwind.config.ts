import type { Config } from "tailwindcss";

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
          50: "#fff7ef",
          100: "#fdebd5",
          200: "#f8d0a3",
          300: "#f0b56d",
          400: "#e6953f",
          500: "#d97a22",
          600: "#bb631a",
          700: "#944d17",
          800: "#763f18",
          900: "#603516"
        },
        ink: "#211c18",
        surface: "#fffdf9"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(87, 61, 24, 0.08)"
      },
      backgroundImage: {
        warm: "radial-gradient(circle at top, rgba(240,181,109,0.20), transparent 34%), radial-gradient(circle at bottom right, rgba(217,122,34,0.14), transparent 26%)"
      }
    }
  },
  plugins: []
};

export default config;
