/* eslint-disable @typescript-eslint/no-explicit-any */
import { Task, createTask } from './task';
import path from 'path';

// there is no __dirname in esm, we might need dynamic imports?
const pkgJsonPath = ['lib', 'esm'].includes(path.basename(__dirname)) ? '../../package.json' : '../package.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require(pkgJsonPath);

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

export const Effection = {
  get root(): Task {
    return getGlobalConfig().root;
  },

  set root(value: Task){
    getGlobalConfig().root = value;
  },

  async reset(): Promise<void> {
    await Effection.root.halt();
    Effection.root = createRootTask();
  },

  async halt(): Promise<void> {
    await Effection.root.halt();
  }
};
