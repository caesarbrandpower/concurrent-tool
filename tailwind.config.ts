import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f10",
        surface: "#15181f",
        "surface-2": "#1a1f29",
        text: "#e5e7eb",
        "text-muted": "rgba(229, 231, 235, 0.7)",
        border: "rgba(255, 255, 255, 0.10)",
        "grad-a": "#2e7cf6",
        "grad-b": "#8463ff",
        cta: "#23c26b",
      },
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
        greed: ["Greed", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
