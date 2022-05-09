import React, { useState } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import { Slice } from '@effection/atom';
import { InspectState } from '@effection/inspect-utils';
import { SettingsMenu, SettingsContext, DEFAULT_SETTINGS } from './settings';
import { TaskPage } from './task-page';
import { TaskTreePage } from './task-tree-page';
import { AppBar } from '@material-ui/core';

export type InspectStateSlice = Slice<InspectState>;

type AppProps = {
  slice: InspectStateSlice
}

export function App({ slice }: AppProps): JSX.Element {
  let routes: RouteObject[] = [
    {
      children: [
        {
          index: true,
          element: <TaskTreePage slice={slice} />,
        },
        {
          path: "tasks/:id",
          element: <TaskPage slice={slice} />
        }
      ],
    },
  ];

  let [settings, setSettings] = useState(DEFAULT_SETTINGS);

  let element = useRoutes(routes);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <AppBar position="absolute">
        <SettingsMenu />
      </AppBar>
      <main>
        {element}
      </main>
    </SettingsContext.Provider>
  );
}
