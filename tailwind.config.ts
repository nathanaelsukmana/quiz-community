import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#1a1a1a",
          100: "#222222",
          200: "#333333",
          300: "#555555",
          400: "#777777",
          500: "#aaaaaa",
          600: "#ffffff",
          700: "#e0e0e0",
          800: "#cccccc",
          900: "#aaaaaa",
          950: "#888888",
        },
      },
    },
  },
  plugins: [],
};

export default config;
