/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, createController } from './controller/controller';
import { Operation } from './operation';
import { swallowHalt } from './halt-error';
import { EventEmitter } from 'events';
import { StateMachine, State } from './state-machine';
import { Labels } from './labels';
import { addTrace } from './error';
import { createFuture, Future, FutureLike, Value } from './future';
import { createRunLoop } from './run-loop';

let COUNTER = 0;

export interface TaskInfo {
  id: number;
  type: string;
  labels: Labels;
  state: State;
}

export interface TaskTree extends TaskInfo {
  yieldingTo?: TaskTree;
  children: TaskTree[];
}

export interface TaskOptions {
  readonly resourceScope?: Task;
  readonly blockParent?: boolean;
  readonly ignoreChildErrors?: boolean;
  readonly ignoreError?: boolean;
  readonly labels?: Labels;
}

export interface Task<TOut = unknown> extends Promise<TOut>, FutureLike<TOut> {
  readonly id: number;
  readonly type: string;
  readonly state: State;
  readonly options: TaskOptions;
  readonly labels: Labels;
  readonly children: Task[];
  readonly future: Future<TOut>;
  readonly yieldingTo: Task | undefined;
  catchHalt(): Promise<TOut | undefined>;
  setLabels(labels: Labels): void;
  run<R>(operation?: Operation<R>, options?: TaskOptions): Task<R>;
  /** @deprecated Use run() instead */
  spawn<R>(operation?: Operation<R>, options?: TaskOptions): Task<R>;
  halt(): Promise<void>;
  start(): void;
  toJSON(): TaskTree;
  on: EventEmitter['on'];
  off: EventEmitter['off'];
}

export function createTask<TOut = unknown>(operation: Operation<TOut>, options: TaskOptions = {}): Task<TOut> {
  let id = ++COUNTER;

  let children = new Set<Task>();
  let emitter = new EventEmitter();

  emitter.setMaxListeners(100000);

  let stateMachine = new StateMachine(emitter);

  let { resolve, future } = createFuture<TOut>();
  let result: Value<TOut>;
  let runLoop = createRunLoop();

  let controller: Controller<TOut>;

  let labels: Labels = { ...operation?.labels, ...options.labels }
  let yieldingTo: Task | undefined;


  if (!labels.name) {
    if (operation?.name) {
      labels.name = operation?.name;
    } else if (!operation) {
      labels.name = 'suspend';
    }
  }

  let task: Task<TOut> = {
    id,

    options,

    future,

    get labels() { return labels },

    get state() { return stateMachine.current; },

    get type() { return controller.type },

    get children() { return Array.from(children); },

    get yieldingTo() { return yieldingTo },

    catchHalt() {
      return future.catch(swallowHalt);
    },

    setLabels(newLabels) {
      labels = { ...labels, ...newLabels };
      emitter.emit('labels', labels);
    },

    run(operation?, options = {}) {
      if(stateMachine.current !== 'running') {
        throw new Error('cannot spawn a child on a task which is not running');
      }
      let child = createTask(operation, { resourceScope: task, ...options });
      link(child as Task);
      child.start();
      return child;
    },

    spawn(operation?, options = {}) {
      console.warn(`DEPRECATED: task.spawn() is deprecated and will be changed or removed prior to the release of effection 2.0\nuse task.run() instead`);
      return task.run(operation, options);
    },

    start() {
      if(stateMachine.current === 'pending') {
        stateMachine.start();
        controller.start();
      }
    },

    async halt() {
      if(stateMachine.current === 'running' || stateMachine.current === 'completing') {
        stateMachine.halting();
        result = { state: 'halted' };
        shutdown(true);
      }
      await future.catch(() => {
        // TODO: should this catch all errors, or only halt errors?
        // see https://github.com/jnicklas/mini-effection/issues/23
      });
    },

    toJSON() {
      return {
        id: id,
        type: controller.type,
        labels: labels,
        state: stateMachine.current,
        yieldingTo: yieldingTo?.toJSON(),
        children: Array.from(children).map((c) => c.toJSON()),
      }
    },

    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args),
    then: (...args) => future.then(...args),
    catch: (...args) => future.catch(...args),
    finally: (...args) => future.finally(...args),
    consume: (...args) => future.consume(...args),
    [Symbol.toStringTag]: `[Task ${id}]`,
  }

  controller = createController(task, operation, {
    onYieldingToChange(value) {
      yieldingTo = value;
      emitter.emit('yieldingTo', value);
    }
  });

  controller.future.consume((value) => {
    if(value.state === 'completed') {
      stateMachine.completing();
      if(!result) {
        result = { state: 'completed', value: value.value };
      }
      shutdown(false);
    } else if(value.state === 'errored') {
      stateMachine.erroring();
      result = { state: 'errored', error: addTrace(value.error, task) };
      shutdown(true);
    }
    finalize();
  });

  function link(child: Task) {
    if(!children.has(child)) {
      child.consume((value) => {
        if(value.state === 'errored' && !child.options.ignoreError && !options.ignoreChildErrors) {
          stateMachine.erroring();
          result = { state: 'errored', error: addTrace(value.error, task) };

          shutdown(true);
        }
        if(children.has(child)) {
          children.delete(child);
          emitter.emit('unlink', child);
        }
        finalize();
      });
      children.add(child);
      emitter.emit('link', child);
    }
  }

  function shutdown(force: boolean) {
    controller.halt();
    controller.future.consume(() => {
      let nextChild: Task | undefined;
      function haltNextChild() {
        runLoop.run(() => {
          nextChild = Array.from(children)
            .reverse()
            .find((c) => (c !== nextChild) && (force || !c.options.blockParent))

          if(nextChild) {
            nextChild.consume(haltNextChild);
            nextChild.halt()
          }
        });
      }
      haltNextChild();
    });
  }

  function finalize() {
    runLoop.run(() => {
      if(Array.from(children).length !== 0) return;
      if(controller.future.state === 'pending') return;
      if(future.state !== 'pending') return;

      stateMachine.finish();
      resolve(result);
    });
  }

  return task;
};
