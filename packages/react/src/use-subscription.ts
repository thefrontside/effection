import { useState } from 'react';
import { Subscription } from 'effection';
import { useOperation } from './use-operation';

export function useSubscription<T>(subscription: Subscription<T>): T | undefined;
export function useSubscription<T>(subscription: Subscription<T>, initial: T): T;
export function useSubscription<T>(subscription: Subscription<T>, initial?: T): T | undefined {
  let [state, setState] = useState<T | undefined>(initial);
  useOperation(subscription.forEach(function*(value) { setState(value) }), [subscription]);
  return state;
}
