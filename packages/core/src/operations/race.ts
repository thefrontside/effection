import type { Operation } from '../operation';
import { withLabels } from '../labels';

export function race<T>(operations: Operation<T>[]): Operation<T> {
  return withLabels((scope) => ({
    perform: (resolve, reject) => {
      for (let operation of operations) {
        if(scope.state === 'running') {
          scope.spawn(function*() {
            try {
              resolve(yield operation);
            } catch (e) {
              reject(e);
            }
          });
        }
      }
    }
  }), { name: 'race', count: operations.length });
}
