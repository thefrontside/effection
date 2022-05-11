import React, { useMemo, ReactNode } from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useSearchParams } from "react-router-dom";

export function Theme({ children }: { children?: ReactNode }): JSX.Element {
  let prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  let [search] = useSearchParams();
  let colorTheme = search.get("theme");

  let theme = useMemo(
    () =>
      createTheme({
        palette: {
          type:
            colorTheme === "light" || colorTheme === "dark"
              ? colorTheme
              : prefersDarkMode
              ? "dark"
              : "light",
        },
      }),
    [prefersDarkMode, colorTheme]
  );

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </>
  );
}
