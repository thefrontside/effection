import { Slice } from "@effection/atom";
import { InspectState } from "@effection/inspect-utils";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container/Container";
import React, { useState } from "react";
import { RouteObject, useRoutes, Link as RouterLink } from "react-router-dom";
import { SettingsButton } from "./components/settings-button";
import { SettingsForm } from "./components/settings-form";
import { DEFAULT_SETTINGS, SettingsContext } from "./context";
import { useStyles } from "./hooks/use-styles";
import { TaskPage } from "./task-page";
import { TaskTreePage } from "./task-tree-page";
import Button from "@material-ui/core/Button";
import ArrowBack from "@material-ui/icons/ArrowBack";

export type InspectStateSlice = Slice<InspectState>;

type AppProps = {
  slice: InspectStateSlice;
};

export function App({ slice }: AppProps): JSX.Element {
  let classes = useStyles();
  let routes: RouteObject[] = [
    {
      path: ":id",
      element: <TaskPage slice={slice} />,
    },
    {
      index: true,
      element: <TaskTreePage slice={slice} showCollapsed={false} />,
    },
  ];

  let [settings, setSettings] = useState(DEFAULT_SETTINGS);

  let element = useRoutes(routes);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className={classes.root}>
        <AppBar position="sticky" className={classes.appBar}>
          <div className={classes.appBarLeftSection}>
            <Button to=".." component={RouterLink} startIcon={<ArrowBack />}>
              Show all
            </Button>
          </div>
          <div className={classes.appBarRightSection}>
            <SettingsButton>
              <SettingsForm />
            </SettingsButton>
          </div>
        </AppBar>
        <main className={classes.content}>
          {element}
        </main>
      </div>
    </SettingsContext.Provider>
  );
}
