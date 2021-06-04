/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, createController } from './controller/controller';
import { Operation } from './operation';
import { swallowHalt } from './halt-error';
import { EventEmitter } from 'events';
import { StateMachine, State } from './state-machine';
import { Labels } from './labels';
import { addTrace } from './error';
import { createFuture, Future, Value } from './future';
import { createRunLoop } from './run-loop';

let COUNTER = 0;
const CONTROLS = Symbol.for('effection/v2/controls');

export interface TaskOptions {
  readonly resourceScope?: Task;
  readonly blockParent?: boolean;
  readonly ignoreChildErrors?: boolean;
  readonly ignoreError?: boolean;
  readonly labels?: Labels;
}

type WithControls<TOut> = { [CONTROLS]?: Controls<TOut> }
type EnsureHandler = () => void;

export interface Task<TOut = unknown> extends Promise<TOut> {
  readonly id: number;
  readonly type: string;
  readonly state: State;
  readonly options: TaskOptions;
  readonly labels: Labels;
  catchHalt(): Promise<TOut | undefined>;
  spawn<R>(operation?: Operation<R>, options?: TaskOptions): Task<R>;
  halt(): Promise<void>;
}

export interface Controls<TOut = unknown> {
  future: Future<TOut>;
  children: Set<Task>;
  start(): void;
  setLabels(labels: Labels): void;
  on: EventEmitter['on'];
  off: EventEmitter['off'];
}

export function createTask<TOut = unknown>(operation: Operation<TOut>, options: TaskOptions = {}): Task<TOut> {
  let id = ++COUNTER;

  let children = new Set<Task>();
  let emitter = new EventEmitter();

  let stateMachine = new StateMachine(emitter);

  let { resolve, future } = createFuture<TOut>();
  let result: Value<TOut>;
  let runLoop = createRunLoop();

  let controls: Controls<TOut> = {
    children,

    future,

    start() {
      stateMachine.start();
      controller.start();
    },

    setLabels(newLabels) {
      labels = { ...labels, ...newLabels };
      emitter.emit('labels', labels);
    },

    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args),
  };

  let controller: Controller<TOut>;

  let labels: Labels = { ...operation?.labels, ...options.labels }

  if(!labels.name && operation?.name) {
    labels.name = operation?.name;
  }

  let task: Task<TOut> & WithControls<TOut> = {
    id,

    options,

    get labels() { return labels },

    get state() { return stateMachine.current; },

    get type() { return controller.type },

    catchHalt() {
      return future.catch(swallowHalt);
    },

    spawn(operation?, options = {}) {
      if(stateMachine.current !== 'running') {
        throw new Error('cannot spawn a child on a task which is not running');
      }
      let child = createTask(operation, { resourceScope: task, ...options });
      link(child as Task);
      getControls(child).start();
      return child;
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
    then: (...args) => future.then(...args),
    catch: (...args) => future.catch(...args),
    finally: (...args) => future.finally(...args),
    [Symbol.toStringTag]: `[Task ${id}]`,
    [CONTROLS]: controls,
  }

  controller = createController(task, operation);

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
      getControls(child).future.consume((value) => {
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
            getControls(nextChild).future.consume(haltNextChild);
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

export function getControls<TOut>(task: Task<TOut>): Controls<TOut> {
  let controls = (task as WithControls<TOut>)[CONTROLS];
  if(!controls) {
    throw new Error(`EFFECTION INTERNAL ERROR unable to retrieve controls for task ${task}`);
  }
  return controls;
}
