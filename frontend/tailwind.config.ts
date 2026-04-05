import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Sora"', '"Avenir Next"', '"Segoe UI"', "sans-serif"],
      },
      colors: {
        pitch: "#10233b",
        grass: "#66d184",
        slate: "#0b1421",
        accent: "#edc17a",
        ink: {
          950: "#08111f",
          900: "#0b1421",
          800: "#10233b",
        },
        surface: {
          0: "#f8fbff",
          50: "#eef3f9",
          900: "#0d1726",
        },
        semantic: {
          success: "#66d184",
          warning: "#edc17a",
          danger: "#ff7d7d",
          info: "#6eb8ff",
        },
      },
      spacing: {
        4.5: "1.125rem",
        5.5: "1.375rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
      },
      boxShadow: {
        panel: "0 26px 80px rgba(3, 8, 16, 0.42)",
        soft: "0 18px 42px rgba(6, 11, 20, 0.22)",
        focus: "0 0 0 4px rgba(237, 193, 122, 0.14)",
      },
      fontSize: {
        "display-sm": ["2.75rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-md": ["3.5rem", { lineHeight: "0.98", letterSpacing: "-0.04em", fontWeight: "600" }],
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.28em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
