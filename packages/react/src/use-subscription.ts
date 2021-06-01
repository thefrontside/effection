import { useState, useEffect, useContext } from 'react';
import { Subscription } from '@effection/subscription';
import { EffectionContext } from './context';

export function useSubscription<T>(subscription: Subscription<T>): T | undefined {
  let scope = useContext(EffectionContext);
  let [state, setState] = useState<T>();

  useEffect(() => {
    let task = scope.spawn(subscription.forEach((value) => { setState(value) }));
    return () => { task.halt() };
  });

  return state;
}
