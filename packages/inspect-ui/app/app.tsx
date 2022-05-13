import { Slice } from "@effection/atom";
import { InspectState } from "@effection/inspect-utils";

import React, { useState } from "react";
import { Navigate, RouteObject, useRoutes } from "react-router-dom";
import { Layout } from "./components/layout";

import { DEFAULT_SETTINGS, SettingsContext } from "./context";

import { TaskPage } from "./task-page";
import { TaskTreePage } from "./task-tree-page";

export type InspectStateSlice = Slice<InspectState>;

type AppProps = {
  slice: InspectStateSlice;
};

export function App({ slice }: AppProps): JSX.Element {
  let routes: RouteObject[] = [
    {
      path: 'tasks',
      element: <Layout />,
      children: [
        {
          path: ":id",
          element: <TaskPage slice={slice} />,
        },
        {
          index: true,
          element: <TaskTreePage slice={slice} showCollapsed={false} />,
        },
      ],
    },
    {
      index: true,
      element: <Navigate to="tasks" />
    }
  ];

  let [settings, setSettings] = useState(DEFAULT_SETTINGS);

  let element = useRoutes(routes);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {element}
    </SettingsContext.Provider>
  );
}
