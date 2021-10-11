import { useState, useEffect, useContext } from 'react';
import { Subscription } from 'effection';
import { EffectionContext } from './context';

export function useSubscription<T>(subscription: Subscription<T>): T | undefined {
  let scope = useContext(EffectionContext);
  let [state, setState] = useState<T>();

  useEffect(() => {
    let task = scope.run(subscription.forEach((value) => { setState(value) }));
    return () => { task.halt() };
  }, [subscription, scope]);

  return state;
}
