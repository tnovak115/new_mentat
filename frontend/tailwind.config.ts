import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        mist: "#e7e9ee",
        steel: "#3f3f46",
        muted: "#71717a",
        cloud: "#f7f8fa",
        page: "#fbfbfc",
        border: "#dfe3ea",
        accent: "#60a5fa",
        savings: "#0f172a",
        risk: "#b45309",
        danger: "#dc2626"
      },
      boxShadow: {
        panel: "0 1px 0 rgba(5, 5, 5, 0.06), 0 12px 30px rgba(5, 5, 5, 0.035)"
      }
    },
  },
  plugins: [],
};

export default config;
