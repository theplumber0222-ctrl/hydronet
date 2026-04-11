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
        industrial: {
          bg: "#1F2937",
          accent: "#0EA5E9",
          cta: "#F97316",
        },
      },
      keyframes: {
        "command-menu-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "command-menu-slide-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "command-menu-fade-in": "command-menu-fade-in 0.15s ease-out",
        "command-menu-slide-in": "command-menu-slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
