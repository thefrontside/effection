import { Config } from "npm:tailwindcss@3.4.3";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Proxima Nova", "proxima-nova", "sans-serif"],
      inter: ["Inter", "inter", "san-serif"],
    },
    extend: {
      colors: {
        "blue-primary": "#14315D",
        "blue-secondary": "#26ABE8",
        "pink-secondary": "#F74D7B",
        "typescript-blue": "#3178c6",
      },
      screens: {
        sm: { max: "540px" },
      },
    },
  },
} satisfies Config;
