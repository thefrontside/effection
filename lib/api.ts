import { createApiInternal } from "./api-internal.ts";
import type { ScopeInternal } from "./scope-internal.ts";
// deno-lint-ignore-file ban-types
import type { Api, Context, Operation, Scope } from "./types.ts";

/**
 * Create an API object that provides middleware support for a set of operations.
 *
 * APIs enable context-sensitive functionality such as dependency injection,
 * test mocking, and instrumentation by allowing middleware to be applied
 * on a per-scope basis.
 *
 * @typeParam A - The shape of the core API object
 * @param name - A unique identifier for this API (used for context naming)
 * @param core - An object containing the core operations, functions, or values of the API
 * @returns An {@link Api} object with `operations`, `around`, and `invoke` members
 *
 * @example
 * ```ts
 * import { createApi, run } from "effection";
 *
 * // Define an API with operations
 * const mathApi = createApi("math", {
 *   add: (a: number, b: number) => a + b,
 *   *multiply(a: number, b: number) {
 *     return a * b;
 *   },
 * });
 *
 * // Use the API operations
 * await run(function*() {
 *   let sum = yield* mathApi.operations.add(2, 3); // 5
 *   let product = yield* mathApi.operations.multiply(2, 3); // 6
 * });
 * ```
 *
 * @example
 * ```ts
 * // Apply middleware for testing or instrumentation
 * await run(function*() {
 *   yield* mathApi.around({
 *     add(args, next) {
 *       console.log("Adding:", args);
 *       return next(...args);
 *     },
 *   });
 *
 *   yield* mathApi.operations.add(2, 3); // logs "Adding: [2, 3]"
 * });
 * ```
 *
 * @example
 * ```ts
 * // Mock operations for testing
 * await run(function*() {
 *   yield* fetchApi.around({
 *     *fetch() {
 *       return { ok: true, json: () => ({ mocked: true }) };
 *     },
 *   });
 *
 *   // All fetch calls in this scope now return mocked data
 * });
 * ```
 *
 * @see {@link Api} for the returned API interface
 * @see {@link Around} for the middleware type
 * @see {@link Scope.around} for applying middleware from outside an operation
 * @since 4.1
 */
export function createApi<A extends {}>(name: string, core: A): Api<A> {
  return createApiInternal(name, core);
}

interface ScopeApi {
  create(parent: Scope): [Scope, () => Operation<void>];
  destroy(scope: Scope): Operation<void>;
  set<T>(scope: Scope, context: Context<T>, value: T): T;
  delete<T>(scope: Scope, context: Context<T>): boolean;
}

interface MainApi {
  main(body: (args: string[]) => Operation<void>): Promise<void>;
}

interface Apis {
  Scope: Api<ScopeApi>;
  Main: Api<MainApi>;
}

export const api: Apis = {
  Scope: createApi<ScopeApi>("Scope", {
    create() {
      throw new TypeError(`no handler for Scope.create()`);
    },
    *destroy() {},
    set(scope, context, value) {
      return ((scope as ScopeInternal).contexts[context.name] = value);
    },
    delete(scope, context) {
      return delete (scope as ScopeInternal).contexts[context.name];
    },
  }),
  Main: createApi<MainApi>("Main", {
    main() {
      throw new TypeError(`missing handler for "main()"`);
    },
  }),
};
