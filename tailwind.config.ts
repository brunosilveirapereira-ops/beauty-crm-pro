import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        blush: "#d66a7f",
        sage: "#6f8f83",
        champagne: "#f7efe7",
        graphite: "#2f3438"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 41, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
