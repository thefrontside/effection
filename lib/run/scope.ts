import type { Context, Frame, Future, Operation, Scope } from "../types.ts";
import { evaluate } from "../deps.ts";
import { create } from "./create.ts";
import { createFrame } from "./frame.ts";
import { getframe, suspend } from "../instructions.ts";

/**
 * Get the scope of the currently running {@link Operation}.
 *
 * @returns an operation yielding the current scope
 */
export function* useScope(): Operation<Scope> {
  let frame = yield* getframe();
  let [scope] = createScope(frame);
  return scope;
}

/**
 * Create a new {@link Scope} as a child of `parent`, inheriting all its contexts.
 * along with a method to destroy the scope. Whenever the scope is destroyd, all
 * tasks and resources it contains will be halted.
 *
 * This function is used mostly by frameworks as an intergration point to enter
 * Effection.
 *
 * @example
 * ```js
 * import { createScope, sleep, suspend } from "effection";
 *
 * let [scope, destroy] = createScope();
 *
 * let delay = scope.run(function*() {
 *   yield* sleep(1000);
 * });
 * scope.run(function*() {
 *   try {
 *     yield* suspend();
 *    } finally {
 *      console.log('done!');
 *    }
 * });
 * await delay;
 * await destroy(); // prints "done!";
 * ```
 *
 * @param parent scope. If no parent is specified it will be free standing.
 * @returns a tuple containing the freshly created scope, along with a function to
 *          destroy it.
 */
export function createScope(parent?: Scope): [Scope, () => Future<void>];

/* @ignore */
export function createScope(parent: Frame): [Scope, () => Future<void>];
/* @ignore */
export function createScope(
  parent?: Frame | Scope,
): [Scope, () => Future<void>] {
  let frame = isScopeInternal(parent)
    ? parent.frame.createChild(suspend)
    : (parent as Frame) ?? createFrame({ operation: suspend });

  let scope = create<ScopeInternal>("Scope", {}, {
    frame,
    run<T>(operation: () => Operation<T>) {
      if (frame.exited) {
        let error = new Error(
          `cannot call run() on a scope that has already been exited`,
        );
        error.name = "InactiveScopeError";
        throw error;
      }

      let child = frame.createChild(operation);
      child.enter();

      evaluate(function* () {
        let result = yield* child;
        if (!result.ok) {
          yield* frame.crash(result.error);
        }
      });

      return child.getTask();
    },

    get spawn() {
      let scope = this!;
      return function spawn<T>(operation: () => Operation<T>) {
        return {
          *[Symbol.iterator]() {
            return scope.run(operation);
          },
        };
      };
    },

    get<T>(context: Context<T>) {
      let { key, defaultValue } = context;
      return (frame.context[key] ?? defaultValue) as T | undefined;
    },
    set<T>(context: Context<T>, value: T) {
      let { key } = context;
      frame.context[key] = value;
      return value;
    },
    expect<T>(context: Context<T>): T {
      let value = scope.get(context);
      if (typeof value === "undefined") {
        let error = new Error(context.key);
        error.name = `MissingContextError`;
        throw error;
      }
      return value;
    },
    delete<T>(context: Context<T>): boolean {
      let { key } = context;
      return delete frame.context[key];
    },
    hasOwn<T>(context: Context<T>): boolean {
      return !!Reflect.getOwnPropertyDescriptor(frame.context, context.key);
    },
  });

  frame.enter();

  return [scope, frame.getTask().halt];
}

interface ScopeInternal extends Scope {
  frame: Frame;
}

function isScopeInternal(value?: Frame | Scope): value is ScopeInternal {
  return !!value && typeof (value as ScopeInternal).run === "function";
}
