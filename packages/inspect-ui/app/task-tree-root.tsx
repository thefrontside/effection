import { useSlice } from '@effection/react';
import React from 'react';
import { Navigate } from 'react-router-dom';
import { InspectStateSlice } from './app';
import { TaskTree } from './task-tree';

export function TaskTreeRoot({ slice }: { slice: InspectStateSlice }): JSX.Element {
  let task = useSlice(slice);

  if (task) {
    return <TaskTree task={task} />;
  } else {
    return <Navigate to="/" />;
  }
}
