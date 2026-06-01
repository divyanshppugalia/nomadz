import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111118",
        surface: "#15151e",
        card: "#1c1c28",
        accent: "#ff5533",
        accent2: "#ff8c42",
        ok: "#22d98b",
        warn: "#ffd166",
      },
      fontFamily: {
        head: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      borderRadius: { xl2: "20px" },
      boxShadow: {
        glow: "0 0 40px rgba(255,85,51,0.35)",
        glowLg: "0 0 60px rgba(255,85,51,0.5)",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "0.7", transform: "translateX(-50%) scale(1)" },
          "50%": { opacity: "1", transform: "translateX(-50%) scale(1.08)" },
        },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
      },
      animation: {
        pulseGlow: "pulseGlow 6s ease-in-out infinite",
        blink: "blink 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
