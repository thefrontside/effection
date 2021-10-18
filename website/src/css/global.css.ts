import { globalStyle } from "@vanilla-extract/css";
import vars, {
  laptopQuery,
  desktopQuery,
  darkThemeQuery,
} from "./frontside-theme.css";
import './docusaurus.css';

globalStyle("html, body", {
  margin: 0,
  fontFamily: vars.fontFamily.main,
  fontSize: vars.pixelBase.mobile,
  lineHeight: vars.lineHeights.base,
  letterSpacing: vars.letterSpacing.base,
  fontWeight: vars.fontWeights.normal,
  background: vars.colors.white,
  color: vars.colors.blue,

  "@media": {
    [darkThemeQuery]: {
      background: vars.colors.black,
      color: vars.colors.white,
    },
    [laptopQuery]: {
      fontSize: vars.pixelBase.laptop,
    },
    [desktopQuery]: {
      fontSize: vars.pixelBase.desktop,
    },
  },
});

globalStyle("a", {
  textDecoration: "none",
});

globalStyle("img", {
  maxWidth: "100%",
});
