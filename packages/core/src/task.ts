/* eslint-disable @typescript-eslint/no-explicit-any */
import { Controller, createController } from './controller/controller';
import { Operation } from './operation';
import { swallowHalt } from './halt-error';
import { EventEmitter } from 'events';
import { StateMachine, State } from './state-machine';
import { Labels } from './labels';
import { addTrace } from './error';
import { createFutureOnRunLoop, Future, FutureLike, Value } from './future';
import { createRunLoop } from './run-loop';
import { isObjectOperation } from './predicates';
import { extractLabels } from './labels';

let COUNTER = 0;

/**
 * @hidden
 */
export interface TaskInfo {
  id: number;
  type: string;
  labels: Labels;
  state: State;
}

/**
 * @hidden
 */
export interface TaskTree extends TaskInfo {
  yieldingTo?: TaskTree;
  children: TaskTree[];
}

/**
 * Task options can be used to configure the behaviour of a task. Options can
 * be passed to {@link run}, `main`, {@link spawn} and when creating a
 * task manually through {@link createTask}.
 */
export interface TaskOptions {
  /**
   * Normally a task's type is inferred from its operation, but it can also be
   * explicitly set via this option.
   */
  readonly type?: string;
  /**
   * The scope of a task describes the scope in which this task creates resource
   * tasks.
   *
   * Usually this is the parent task, but in some instances it can be useful to
   * change the scope of a task. This is for example often the case with
   * "higher-order operations", that is operations which take another operation
   * as an argument, such as the {@link all} operation.
   *
   * This is a very advanced feature and great care should be taken when using
   * it as it can lead to possibly breaking some of the guarantees that
   * Effection makes.
   */
  readonly scope?: Task;
  /**
   * @internal
   *
   * The yieldScope of a task describes the scope in which this task's yield
   * points create resources. This is normally the task itself. It is currently
   * only changed for resource's `init` tasks.
   *
   * This is an internal API and you should not set this option yourself.
   */
  readonly yieldScope?: Task;
  /**
   * Normally when a task finishes its operation, it halts all of its children.
   * When setting this option to `true` on a child, it will cause the parent
   * task to wait for the child to complete after it finishes its operation.
   * Essentially it allows a child to block the completion of its parent.
   */
  readonly blockParent?: boolean;
  /**
   * When a child task becomes errored it normally causes its parent task to
   * become errored as well. When setting this option to `true` on a parent
   * task, an error in its children will be ignored. This is useful for some
   * tasks which want to have finer grained control over their children, such
   * as supervisors or root tasks.
   */
  readonly ignoreChildErrors?: boolean;
  /**
   * When a child task becomes errored it normally causes its parent task to
   * become errored as well. When setting this option to `true` on a child
   * task, then an error in the child will not cause the parent to become
   * errored. This is useful for some tasks which want finer grained control
   * over error conditions.
   */
  readonly ignoreError?: boolean;
  /**
   * Set the given labels on the task.
   */
  readonly labels?: Labels;
}

/**
 * A `Task` in Effection has many responsibilities. Fundamentally it represents
 * a computation which at some point will result in either a value or an error,
 * or become halted. It can also have children, which are also tasks.
 *
 * See [the Task and Operations guide](https://frontside.com/effection/docs/guides/tasks) for more information.
 *
 */
export interface Task<TOut = unknown> extends Promise<TOut>, FutureLike<TOut> {
  /**
   * Each `Task` has a unique id
   */
  readonly id: number;
  /**
   * The type of a `Task` is usually determined by the operation that the task
   * is running, but it can also be adjusted via the `type` option.
   */
  readonly type: string;
  /**
   * Returns the {@link State} that the task is currently in.
   */
  readonly state: State;
  /**
   * Returns the options that the task was created with
   */
  readonly options: TaskOptions;
  /**
   * Returns a map of {@link Labels} which provide additional information about
   * the task, such as its name, or any other metadata that the task wants to
   * provide.
   */
  readonly labels: Labels;
  /**
   * Returns a list of the task's children
   */
  readonly children: Task[];
  /**
   * Returns a {@link Future} for this task. The task itself can act as a
   * Future, so usually you do not need to access this property explicitly.
   */
  readonly future: Future<TOut>;
  /**
   * Returns the task that this task is currently yielding to. When using a
   * generator with a task, a task ends up processing one operation at a time,
   * each such operation runs in its own task, and can be accessed via this
   * property.
   *
   * ### Example
   *
   * ``` typescript
   * import { run, sleep } from 'effection'
   *
   * let task = run(function*() {
   *   yield sleep(2000);
   * });
   *
   * console.log(task.yieldingTo); // => logs the sleep task
   * ```
   */
  readonly yieldingTo: Task | undefined;
  /**
   * Tasks which construct a resource create a special task in the background called
   * a resource task, which groups everything running inside the resource. This property
   * provides access to such a task.
   *
   * ### Example
   *
   * ``` typescript
   * import { main, spawn, fetch } from 'effection'
   *
   * main(function*() {
   *   let fetchTask = yield spawn(fetch('http://www.example.com'));
   *   console.log(fetchTask.resourceTask); // => logs the resource task of the fetch
   * });
   * ```
   */
  readonly resourceTask: Task | undefined;
  /**
   * When using a task as a `Promise`, it would usually be rejected when the task
   * is halted.  Using `catchHalt()` we can treat a `halt` as the promise
   * resolving to `undefined`, rather than being rejected.
   *
   * ### Example
   *
   * ``` typescript
   * import { run, sleep } from 'effection'
   *
   * let task = run(function*() {
   *   yield sleep(2000);
   *   return "done!";
   * });
   *
   * task.halt();
   *
   * task.then((value) => console.log(value)); // => log "undefined"
   */
  catchHalt(): Promise<TOut | undefined>;
  /**
   * Sets the given {@link Labels} on the task. This only adds new labels or
   * overwrites labels with the same key, but does not remove other labels.
   *
   * See also the {@link label} operation for setting labels dynamically.
   *
   * ### Example
   *
   * ``` typescript
   * import { run } from 'effection'
   *
   * let task = run();
   * task.setLabels({ name: 'myTask', florb: 123 });
   * ```
   */
  setLabels(labels: Labels): void;
  /**
   * Run the given operation as a child of this task.
   *
   * This is similar to {@link spawn}, but it is *not* an operation and
   * therefore should *not* be used with `yield`. If you are inside Effection
   * code, you should generally prefer {@link spawn}. `run` is useful when you
   * are creating children from outside of Effection.
   *
   * ### Example
   *
   * ``` typescript
   * import { run } from 'effection'
   *
   * let task = run();
   * task.run(function*() { ... }) // run a child of this task
   * ```
   *
   * @typeParam TOutChild the type that the child resolves to
   */
  run<TOutChild>(operation?: Operation<TOutChild>, options?: TaskOptions): Task<TOutChild>;
  /**
   * An operation to run the given operation as child of this task.
   *
   * This is similar to {@link run}, but it is an operation and therefore must
   * be used with `yield` or `run`. If you are inside Effection code, you
   * should generally prefer `spawn`. {@link run} is useful when you are
   * creating children from outside of Effection.
   *
   * ### Example
   *
   * ``` typescript
   * import { main, spawn } from 'effection'
   *
   * main(function*(mainTask) {
   *   yield function*() {
   *     yield mainTask.spawn(function*() { ... }); // => run as child of `main`.
   *   }
   * });
   * ```
   *
   * @param operation the operation that the child runs
   * @typeParam TOutChild the type that the child resolves to
   */
  spawn<TOutChild>(operation?: Operation<TOutChild>, options?: TaskOptions): Operation<Task<TOutChild>>;
  /**
   * Cause this task to halt. This will halt the task itself, as well as any task
   * it is currently {@link yieldingTo} and its {@link children}.
   */
  halt(): Promise<void>;
  /**
   * Starts running the task if it has not yet started, does nothing otherwise.
   * You will only need to call this if you created your task manually through
   * {@link createTask}.
   *
   * ### Example
   *
   * ``` typescript
   * import { createTask } from 'effection'
   *
   * let task = createTask(someOperation);
   * console.log(task.state) // => 'pending';
   *
   * task.start();
   * console.log(task.state) // => 'running';
   * ```
   */
  start(): void;
  /**
   * Serializes information about the task into an object. This will include
   * the task's {@link id}, {@link state}, {@link type}, {@link labels} as well
   * as the task it is {@link yieldingTo} and its {@link children}.
   */
  toJSON(): TaskTree;
  /**
   * Returns a readable description of the task and its children. This is
   * useful for debugging.  The output can be improved by applying {@link labels}.
   * For more advanced debugging you can also use the
   * [inspector](https://frontside.com/effection/docs/guides/inspector).
   */
  toString(): string;

  /**
   * @hidden
   */
  on: EventEmitter['on'];

  /**
   * @hidden
   */
  off: EventEmitter['off'];
}

/**
 * Low level interface to create a task which does not have a parent. Normally all
 * tasks are spawned as children of {@link Effection}.root, but on rare occasions it is necessary
 * to create a task outside the normal task hierarchy.
 *
 * @param operation the operation that the task runs
 * @param options the options that the task is configured with
 * @returns the new task
 */
export function createTask<TOut = unknown>(operation: Operation<TOut>, options: TaskOptions = {}): Task<TOut> {
  let id = ++COUNTER;

  let children = new Set<Task>();
  let emitter = new EventEmitter();

  emitter.setMaxListeners(100000);

  let stateMachine = new StateMachine(emitter);

  let result: Value<TOut>;
  let runLoop = createRunLoop(`task ${id}`);
  let { produce, future } = createFutureOnRunLoop<TOut>(runLoop);

  let controller: Controller<TOut>;

  let labels: Labels = { ...extractLabels(operation), ...options.labels };
  let yieldingTo: Task | undefined;

  if (!labels.name) {
    if (!isObjectOperation<TOut>(operation) && operation?.name) {
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

    get state() { return stateMachine.current },

    get type() { return options.type || controller.type },

    get children() { return Array.from(children) },

    get yieldingTo() { return yieldingTo },

    get resourceTask() { return controller.resourceTask },

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
      let child = createTask(operation, { scope: task, ...options });
      link(child as Task);
      child.start();
      return child;
    },

    spawn(operation?, options = {}) {
      return {
        name: 'spawn',
        *init() {
          return task.run(operation, options);
        }
      };
    },

    start() {
      runLoop.run(() => {
        if(stateMachine.current === 'pending') {
          stateMachine.start();
          controller.start();
        }
      });
    },

    async halt() {
      controller.halt();
      if(stateMachine.current === 'running') {
        stateMachine.halting();
        result = { state: 'halted' };
      }
      shutdown(true);
      await future.catch(() => {
        // TODO: should this catch all errors, or only halt errors?
        // see https://github.com/jnicklas/mini-effection/issues/23
      });
    },

    toJSON() {
      return {
        id: id,
        type: task.type,
        labels: labels,
        state: stateMachine.current,
        yieldingTo: yieldingTo?.toJSON(),
        children: Array.from(children).map((c) => c.toJSON()),
      };
    },

    toString() {
      let formattedLabels = Object.entries(labels).filter(([key]) => key !== 'name' && key !== 'expand').map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(' ');
      return [
        [labels.name || 'task', formattedLabels, `[${task.type} ${id}]`].filter(Boolean).join(' '),
        yieldingTo && yieldingTo.toString().split('\n').map(l => '┃ ' + l).join('\n').replace(/^┃ /, `┣ yield `),
        ...Array.from(children).map((c) => c.toString().split('\n').map(l => '┃ ' + l).join('\n').replace(/^┃/, '┣'),)
      ].filter(Boolean).join('\n');
    },

    on: (...args) => emitter.on(...args),
    off: (...args) => emitter.off(...args),
    then: (...args) => future.then(...args),
    catch: (...args) => future.catch(...args),
    finally: (...args) => future.finally(...args),
    consume: (...args) => future.consume(...args),
    [Symbol.toStringTag]: `[Task ${id}]`,
  };

  controller = createController(task, operation, {
    runLoop,
    onYieldingToChange(value) {
      yieldingTo = value;
      emitter.emit('yieldingTo', value);
    }
  });

  controller.future.consume((value) => {
    if(stateMachine.isFinalized) return;
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
    } else if(value.state === 'halted' && stateMachine.current !== 'erroring') {
      stateMachine.halting();
      result = { state: 'halted' };
      shutdown(true);
    }
    finalize();
  });

  function link(child: Task) {
    if(!children.has(child)) {
      child.consume((value) => {
        runLoop.run(() => {
          if(stateMachine.isFinalized) return;
          if(value.state === 'errored' && !child.options.ignoreError && !options.ignoreChildErrors) {
            stateMachine.erroring();
            result = { state: 'errored', error: addTrace(value.error, task) };

            controller.halt();
            shutdown(true);
          }
          if(children.has(child)) {
            children.delete(child);
            emitter.emit('unlink', child);
          }
          finalize();
        });
      });
      children.add(child);
      emitter.emit('link', child);
    }
  }

  function shutdown(force: boolean) {
    controller.future.consume(() => {
      let nextChild: Task | undefined;
      function haltNextChild() {
        runLoop.run(() => {
          nextChild = Array.from(children)
            .reverse()
            .find((c) => (c !== nextChild) && (force || !c.options.blockParent));

          if(nextChild) {
            nextChild.consume(haltNextChild);
            nextChild.halt();
          }
        });
      }
      haltNextChild();
    });
  }

  function finalize() {
    if(Array.from(children).length !== 0) return;
    if(controller.future.state === 'pending') return;
    if(future.state !== 'pending') return;

    stateMachine.finish();
    produce(result);
  }

  return task;
}
