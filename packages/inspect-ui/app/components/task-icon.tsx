import React from 'react';
import { State } from 'effection';
import HaltedIcon from './halted-icon';
import CompletedIcon from './completed-icon';
import ErroredIcon from './errored-icon';

type Props = {
  state: State;
}

export function TaskIcon({ state }: Props): JSX.Element | null {
  if(state === 'halting' || state === 'halted') {
    return (
      <HaltedIcon />
    );
  } else if(state === 'completing' || state === 'completed') {
    return (
      <CompletedIcon />
    );
  } else if(state === 'erroring' || state === 'errored') {
    return (
      <ErroredIcon />
    );
  } else {
    return null;
  }
}
