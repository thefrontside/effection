import React, { useState } from 'react';
import { Slice } from '@effection/atom';
import { useSlice } from '@effection/react';
import { TaskState } from './task-state';
import { TaskTree } from './task-tree';
import { SettingsMenu, SettingsContext, DEFAULT_SETTINGS } from './settings';

type AppProps = {
  slice: Slice<TaskState>;
}

export function App({ slice }: AppProps): JSX.Element {
  let [settings, setSettings] = useState(DEFAULT_SETTINGS);
  let task = useSlice(slice);
  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className="inspector">
        <div className="inspector--menu">
          <h1 className="inspector--menu--title">Effection Inspector</h1>
          <div className="inspector--menu--toolbar">
            <SettingsMenu/>
          </div>
        </div>
        <div className="inspector--main">
          <TaskTree task={task}/>
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
