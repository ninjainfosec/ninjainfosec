import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#E8C76B",
          deep: "#8C6F1E",
          ember: "#B8860B",
        },
        nox: {
          black: "#000000",
          void: "#050505",
          ash: "#0B0B0C",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Playfair Display", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        royal: "0.45em",
        regal: "0.6em",
      },
    },
  },
  plugins: [],
};

export default config;
