import type { Operation } from '../operation';

export function race<T>(operations: Operation<T>[]): Operation<T> {
  return (scope) => ({
    perform: (resolve, reject) => {
      for (let operation of operations) {
        scope.spawn(function*() {
          try {
            resolve(yield operation);
          } catch (error) {
            reject(error);
          }
        })
      }
    }
  });
}
