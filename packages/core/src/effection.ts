/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, createTask } from './task';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import packageInfo from '../package.json';

const { version } = packageInfo;

const MAJOR_VERSION = version.split('.')[0];
const GLOBAL_PROPERTY = `__effectionV${MAJOR_VERSION}`;

function createRootTask() {
  let task = createTask(undefined, { ignoreChildErrors: true, labels: { name: 'root' } });
  task.start();
  return task;
}

type GlobalConfig = {
  root: Task;
}

function getGlobalConfig() {
  if(!(globalThis as any)[GLOBAL_PROPERTY]) {
    (globalThis as any)[GLOBAL_PROPERTY] = {
      root: createRootTask()
    };
  }
  return (globalThis as any)[GLOBAL_PROPERTY] as GlobalConfig;
}

/**
 * The `Effection` constant provides access to some global properties in
 * Effection. Most importantly, `Effection` has a {@link root} task, which all
 * tasks spawned by {@link run} or `main` are spawned under. You normally do
 * not need to work with this task directly, but it is useful for debugging and
 * testing.
 */
export const Effection = {
  /**
   * All tasks spawned by {@link run} or `main` are spawned as children of this
   * task. You normally do not need to work with this task directly, but it is
   * useful for debugging and testing.
   */
  get root(): Task {
    return getGlobalConfig().root;
  },

  /**
   * Set the root task to a new task.
   */
  set root(value: Task){
    getGlobalConfig().root = value;
  },

  /**
   * Completely halt all running Effection tasks and create a new root task.
   */
  async reset(): Promise<void> {
    await Effection.root.halt();
    Effection.root = createRootTask();
  },

  /**
   * Completely halt all running Effection tasks.
   */
  async halt(): Promise<void> {
    await Effection.root.halt();
  }
};
