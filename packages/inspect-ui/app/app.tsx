import React, { useState } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import { Slice } from '@effection/atom';
import { InspectState } from '@effection/inspect-utils';
import { SettingsMenu, SettingsContext, DEFAULT_SETTINGS } from './settings';
import { TaskPage } from './task-page';
import { TaskTreeRoot } from './task-tree-root';

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
          element: <TaskTreeRoot slice={slice} />,
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
      <div className="inspector">
        <div className="inspector--menu">
          <h1 className="inspector--menu--title">Effection Inspector</h1>
          <div className="inspector--menu--toolbar">
            <SettingsMenu />
          </div>
        </div>
        <div className="inspector--main">{element}</div>
      </div>
    </SettingsContext.Provider>
  );
}
