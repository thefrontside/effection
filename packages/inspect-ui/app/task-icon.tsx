import React from 'react';
import { State } from 'effection';

type Props = {
  state: State;
}

export function TaskIcon({ state }: Props): JSX.Element | null {
  if(state === 'halting' || state === 'halted') {
    return (
      <i className="task--title--icon icon halted"></i>
    );
  } else if(state === 'completing' || state === 'completed') {
    return (
      <i className="task--title--icon icon completed"></i>
    );
  } else if(state === 'erroring' || state === 'errored') {
    return (
      <i className="task--title--icon icon failed"></i>
    );
  } else {
    return null;
  }
}
