/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, createTask, getControls } from './task';
import { version } from '../package.json';

const MAJOR_VERSION = version.split('.')[0];
const GLOBAL_PROPERTY = `__effectionV${MAJOR_VERSION}`;

function createRootTask() {
  let task = createTask(undefined, { ignoreChildErrors: true });
  getControls(task).start();
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

export const Effection = {
  get root(): Task {
    return getGlobalConfig().root;
  },

  set root(value: Task){
    getGlobalConfig().root = value;
  },

  async reset() {
    await Effection.root.halt();
    Effection.root = createRootTask();
  },

  async halt() {
    await Effection.root.halt();
  }
}
