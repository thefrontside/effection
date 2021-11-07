import React from 'react';
import { State } from 'effection';

type Props = {
  state: State;
}

export function TaskIcon({ state }: Props): JSX.Element {
  if(state === 'halting' || state === 'halted') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("halted.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else if(state === 'completing' || state === 'completed') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("completed.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else if(state === 'erroring' || state === 'errored') {
    return (
      <div className="task--title--icon">
        <img src={(new URL("failed.svg", import.meta.url)).toString()}/>
      </div>
    );
  } else {
    return null;
  }
}
