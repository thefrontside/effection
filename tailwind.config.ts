import presetTailwind from "npm:@twind/preset-tailwind@1.1.4";
import presetTypography from "npm:@twind/preset-typography@1.0.7";
import defaultTheme from "npm:@twind/preset-tailwind@1.1.4/defaultTheme";
import { defineConfig } from "npm:@twind/core@1.1.3";

export const config = defineConfig({
  presets: [presetTailwind(), presetTypography(), presetFrontside()],
});

function presetFrontside() {
  return {
    rules: [
      ["header", {
        backgroundImage:
          "linear-gradient(45deg, #14315d -5%, #44378a, #26abe8 105%)",
        color: "#fff",
      }],
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
          ...defaultTheme.screens,
          sm: { max: "540px" },
        },
      },
    },
  };
}
