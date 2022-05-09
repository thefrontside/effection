import type { DependencyList } from "react";
import type { Operation } from "effection";
import { useState } from "react";
import { useOperation } from "./use-operation";

export type ResourceHandle<T> = {
  type: 'pending';
} | {
  type: 'resolved';
  value: T;
} | {
  type: 'rejected';
  error: Error;
}

export function useResource<T>(resource: Operation<T>, deps: DependencyList = []): ResourceHandle<T> {
  let [state, setState] = useState<ResourceHandle<T>>({ type: 'pending' });

  useOperation(function*() {
    try {
      yield function* ErrorBoundary() {
        setState({ type: 'resolved', value: yield resource });
        yield;
      }
    } catch (error: any) {
      setState({ type: 'rejected', error });
    }
  }, deps as unknown[]);

  return state;
}
