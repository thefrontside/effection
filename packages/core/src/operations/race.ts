import type { Operation } from '../operation';
import type { Task } from '../task';
import { withLabels } from '../labels';
import { createFuture } from '../future';

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
