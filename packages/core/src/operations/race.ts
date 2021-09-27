import type { Operation } from '../operation';
import type { Task } from '../task';
import { withLabels } from '../labels';
import { createFuture } from '../future';

/**
 * Race the given operations against each other and return the value of
 * whichever operation returns first. This has the same purpose as
 * [Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race).
 *
 * If an operation become errored first, then `race` will fail with this error.
 * After the first operation wins the race, all other operations will become
 * halted and therefore cannot throw any further errors.
 *
 * ### Example
 *
 * ```typescript
 * import { main, race, fetch } from 'effection';
 *
 * main(function*() {
 *  let fastest = yield race([fetch('http://google.com').text(), fetch('http://bing.com').text()]);
 *  // ...
 * });
 * ```
 *
 * @typeParam T the type of the operations that race against each other
 * @param operations a list of operations to race against each other
 * @returns the value of the fastest operation
 */
export function race<T>(operations: Operation<T>[]): Operation<T> {
  return withLabels(function*(task) {
    let { resolve, future } = createFuture<Task>();
    let tasks: Task[] = [];

    for (let operation of operations) {
      if(task.state === 'running') {
        let child = task.run(operation, { ignoreError: true, scope: task.options.scope });
        child.consume(() => resolve(child));
        tasks.push(child);
      }
    }

    let resultChild = yield future;

    for(let child of tasks) {
      if(child !== resultChild) {
        child.halt();
      }
    }

    return yield resultChild;
  }, { name: 'race', count: operations.length });
}
