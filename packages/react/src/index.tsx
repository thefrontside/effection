import { main } from 'effection';

import { useCallback, useState } from "react";

type OperationResult = [(...args: any[]) => any, any];

interface AnyFunction {
  (...args: any[]): any;
}

export function useEffection<T extends AnyFunction>(task: T) : OperationResult {
  const [currentState, setCurrentState] = useState<any>({ state: 'unstarted' });

  const perform = useCallback(async (...args) => {
    const context = main(function* () {
      return yield task(args);
    })
    setCurrentState(context)
    await context;
    setCurrentState(context)
  }, [])

  return [perform, currentState];
}
