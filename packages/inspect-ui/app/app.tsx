import React from 'react';
import { Slice } from '@effection/atom';
import { useSlice } from '@effection/react';
import { TaskState } from './task-state';
import { TaskTree } from './task-tree';

type AppProps = {
  slice: Slice<TaskState>;
}

export function App({ slice }: AppProps): JSX.Element {
  let task = useSlice(slice);
  return (
    <div className="inspector">
      <div className="inspector--menu">
        <h1>Effection Inspector</h1>
      </div>
      <div className="inspector--main">
        <TaskTree task={task}/>
      </div>
    </div>
  );
}
