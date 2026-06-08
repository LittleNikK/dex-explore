import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050505",
          cyan: "#00F0FF",
          violet: "#8A2BE2",
          darkGray: "#0B0C10",
        },
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: {
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        }
      },
      fontFamily: {
        sans: ["'Inter'", "'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-slow": "glow 4s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(0, 240, 255, 0.1), 0 0 20px rgba(138, 43, 226, 0.05)" },
          "100%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.25), 0 0 40px rgba(138, 43, 226, 0.15)" }
        }
      }
    },
  },
  plugins: []
} satisfies Config;
