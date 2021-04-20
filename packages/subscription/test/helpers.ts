import { Operation, sleep, getControls } from '@effection/core';

// TODO: move this to core?
export function race<T>(...ops: Operation<T>[]): Operation<T> {
  return function(scope) {
    return {
      perform: (resolve, reject) => {
        for(let op of ops) {
          scope.spawn(function*() {
            try {
              resolve(yield op);
            } catch (error) {
              reject(error);
            }
          });
        }
      }
    }
  }
}

export function abortAfter<T>(op: Operation<T>, ms: number): Operation<T | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return race<any>(sleep(ms), op);
}
