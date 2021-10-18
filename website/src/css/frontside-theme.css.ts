import { createGlobalTheme } from "@vanilla-extract/css";

export const laptopQuery = "screen and (min-width: 992px)";
export const desktopQuery = "screen and (min-width: 1440px)";
export const darkThemeQuery = "(prefers-color-scheme: dark)";
export const colorValues = {
  white: "#fff",
  black: "#0e151d",
  pink: "#f74d7b",
  blue: "#14315d",
  skyblue: "#26abe8",
  purple: "#8c7db3",
  violet: "#44378a",
  lightGreen: "#9bf0e1",
  green: "#36baa2",
  gray: "#8995aa",
};

const frontsideTheme = createGlobalTheme(":root", {
  colors: colorValues,
  fontFamily: {
    main: '"Proxima Nova", proxima-nova, sans-serif',
  },
  pixelBase: {
    mobile: "18px",
    laptop: "20px",
    desktop: "22px",
    maxWdith: "1440px",
  },
  fontSize: {
    xs: "0.710rem",
    sm: "0.909rem",
    base: "1rem",
    lg: "1.136rem",
    xl: "1.682rem",
    "2xl": "2.045rem",
    "3xl": "2.273rem",
    "4xl": "2.727rem",
  },
  lineHeights: {
    xs: "0.818rem",
    sm: "1.136rem",
    base: "1.335rem",
    lg: "1.500rem",
    xl: "1.800rem",
    "2xl": "2.150rem",
    "3xl": "2.4250rem",
  },
  space: {
    auto: "auto",
    none: "0",
    "3xs": "0.31rem",
    "2xs": "0.5rem",
    xs: "1rem",
    sm: "1.136rem",
    md: "2.5rem",
    lg: "3.364rem",
    xl: "4.091rem",
    "2xl": "7.455rem",
    "3xl": "12.091rem",
    "4xl": "17.136rem",
  },
  letterSpacing: {
    xs: "0.025rem",
    sm: "0",
    base: "-0.009rem",
    lg: "-0.023rem",
    xl: "0.013rem",
    "2xl": "0.020rem",
    "3xl": "0.015rem",
    "4xl": "0.081rem",
  },
  fontWeights: {
    normal: "400",
    bold: "700",
    extrabold: "800",
  },
  breakpoints: {
    laptop: laptopQuery,
    desktop: desktopQuery,
  },
  theme: {
    dark: darkThemeQuery,
  },
  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    xl: "2rem",
  },
});

export default frontsideTheme;
