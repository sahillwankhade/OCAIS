import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6", // primary teal
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        clinic: {
          primary: "#0f766e",
          primaryHover: "#115e59",
          accent: "#2563eb",
          surface: "#ffffff",
          bg: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          textMuted: "#475569",
          success: "#16a34a",
          warning: "#d97706",
          danger: "#dc2626",
          info: "#0284c7",
        },
      },
      fontSize: {
        // Accessibility requirement: body at least 16px (1rem)
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.2" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
      },
      borderRadius: {
        medical: "0.75rem",
        card: "1rem",
        pill: "9999px",
      },
      minHeight: {
        touch: "48px", // accessible touch target
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};

export default config;

