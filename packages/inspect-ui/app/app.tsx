import React, { useState } from 'react';
import { Switch, Route, Link, Redirect, RouteComponentProps } from 'react-router-dom';
import { Slice } from '@effection/atom';
import { useSlice } from '@effection/react';
import { InspectState } from '@effection/inspect-utils';
import { TaskTree } from './task-tree';
import { SettingsMenu, SettingsContext, DEFAULT_SETTINGS } from './settings';

type AppProps = {
  slice: Slice<InspectState>;
}

function findSliceById(slice: Slice<InspectState>, targetId: number): Slice<InspectState> | undefined {
  let task = slice.get();

  if(task.id === targetId) {
    return slice;
  }

  if(task.yieldingTo) {
    let result = findSliceById(slice.slice('yieldingTo') as Slice<InspectState>, targetId);
    if(result) {
      return result;
    }
  }

  for(let [index] of task.children.entries()) {
    let result = findSliceById(slice.slice('children', index), targetId);
    if(result) {
      return result;
    }
  }

  return undefined;
}

function TaskTreeRoot({ slice }: { slice: Slice<InspectState> }) {
  let task = useSlice(slice);

  if(task) {
    return <TaskTree task={task}/>;
  } else {
    return <Redirect to="/"/>;
  }
}


export function App({ slice }: AppProps): JSX.Element {
  let [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function AllTasksPage(): JSX.Element {
    return <TaskTreeRoot slice={slice}/>;
  }

  function TaskPage({ match }: RouteComponentProps<{ id: string }>): JSX.Element {
    let targetSlice = findSliceById(slice, Number(match.params.id));
    if(targetSlice) {
      return (
        <div>
          <p><Link to='/' className="inspector--main--return">← Show all</Link></p>

          <TaskTreeRoot slice={targetSlice}/>
        </div>
      );
    } else {
      return <Redirect to="/"/>;
    }
  }

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
          <Switch>
            <Route exact path="/" component={AllTasksPage}/>
            <Route path="/tasks/:id" component={TaskPage}/>
          </Switch>
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
