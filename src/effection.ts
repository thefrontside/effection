import { Task } from './task';

function createRootTask() {
  let task = new Task(undefined, { ignoreChildErrors: true });
  task.start();
  return task;
}

export const Effection = {
  root: createRootTask(),

  async reset() {
    await Effection.root.halt();
    Effection.root = createRootTask();
  }
}
