import { Slice } from "@effection/atom";
import { InspectState } from "@effection/inspect-utils";
import AppBar from "@material-ui/core/AppBar";
import Container from "@material-ui/core/Container/Container";
import React, { useState } from "react";
import { RouteObject, useRoutes } from "react-router-dom";
import { SettingsButton } from "./components/settings-button";
import { SettingsForm } from "./components/settings-form";
import { DEFAULT_SETTINGS, SettingsContext } from "./context";
import { useStyles } from "./hooks/use-styles";
import { TaskPage } from "./task-page";
import { TaskTreePage } from "./task-tree-page";

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
        <AppBar position="absolute" className={classes.appBar}>
          <SettingsButton>
            <SettingsForm />
          </SettingsButton>
        </AppBar>
        <main className={classes.content}>
          <div className={classes.appBarSpacer}>
            <Container className={classes.container}>
              <>{element}</>
            </Container>
          </div>
        </main>
      </div>
    </SettingsContext.Provider>
  );
}
