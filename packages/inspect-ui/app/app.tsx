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
    <div>
      <h1>Effection Inspector</h1>

      <TaskTree task={task}/>
    </div>
  );
}
