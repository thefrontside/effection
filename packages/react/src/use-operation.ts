/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useContext } from 'react';
import { Operation } from 'effection';
import { EffectionContext } from './context';

export function useOperation<T>(operation: Operation<T>, dependencies: unknown[] = []): void {
  let scope = useContext(EffectionContext);

  useEffect(() => {
    let task = scope.run(operation);
    return () => { task.halt() };
  }, [scope, ...dependencies]);
}
