import React, { useState } from "react";
import { RouteObject, useRoutes } from "react-router-dom";
import { Slice } from "@effection/atom";
import { InspectState } from "@effection/inspect-utils";
import {
  SettingsMenu,
  SettingsContext,
  DEFAULT_SETTINGS,
} from "./components/settings";
import { TaskPage } from "./task-page";
import { TaskTreePage } from "./task-tree-page";
import AppBar from "@material-ui/core/AppBar";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Container from "@material-ui/core/Container/Container";

export type InspectStateSlice = Slice<InspectState>;

type AppProps = {
  slice: InspectStateSlice;
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  content: {
    flexGrow: 1,
    height: "100vh",
    overflow: "auto",
  },
  appBarSpacer: theme.mixins.toolbar,
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

export function App({ slice }: AppProps): JSX.Element {
  let classes = useStyles();
  let routes: RouteObject[] = [
    {
      children: [
        {
          index: true,
          element: <TaskTreePage slice={slice} />,
        },
        {
          path: "tasks/:id",
          element: <TaskPage slice={slice} />,
        },
      ],
    },
  ];

  let [settings, setSettings] = useState(DEFAULT_SETTINGS);

  let element = useRoutes(routes);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="absolute">
          <SettingsMenu />
        </AppBar>
        <main className={classes.content}>
          <div className={classes.appBarSpacer}>
            <Container maxWidth="lg" className={classes.container}>
              <>{element}</>
            </Container>
          </div>
        </main>
      </div>
    </SettingsContext.Provider>
  );
}
