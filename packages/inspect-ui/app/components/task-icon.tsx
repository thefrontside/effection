import React from 'react';
import { State } from 'effection';
import { SvgIconProps } from '@material-ui/core/SvgIcon';
import HaltedIcon from './halted-icon';
import CompletedIcon from './completed-icon';
import ErroredIcon from './errored-icon';

type Props = {
  state: State;
} & SvgIconProps;

export function TaskIcon({ state, ...props }: Props): JSX.Element | null {
  if(state === 'halting' || state === 'halted') {
    return (
      <HaltedIcon {...props} />
    );
  } else if(state === 'completing' || state === 'completed') {
    return <CompletedIcon {...props} />;
  } else if(state === 'erroring' || state === 'errored') {
    return <ErroredIcon {...props} />;
  } else {
    return null;
  }
}
