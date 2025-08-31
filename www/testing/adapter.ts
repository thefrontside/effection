import type { Future, Operation, Result, Scope } from "effection";
import { createScope, Err, Ok } from "effection";

export interface TestOperation {
  (): Operation<void>;
}

export interface TestAdapter {
  /**
   * The parent of this adapter. All of the setup from this adapter will be
   * run in addition to the setup of this adapter during `runTest()`
   */
  readonly parent?: TestAdapter;

  /**
   * The name of this adapter which is mostly useful for debugging purposes
   */
  readonly name: string;

  /**
   * A qualified name that contains not only the name of this adapter, but of all its
   * ancestors. E.g. `All Tests > File System > write`
   */
  readonly fullname: string;

  /**
   * Every test adapter has its own Effection `Scope` which holds the resources necessary
   * to run this test.
   */
  readonly scope: Scope;

  /**
   * A list of this test adapter and every adapter that it descends from.
   */
  readonly lineage: Array<TestAdapter>;

  /**
   * The setup operations that will be run by this test adapter. It only includes those
   * setups that are associated with this adapter, not those of its ancestors.
   */
  readonly setups: TestOperation[];

  /**
   * Add a setup operation to every test that is part of this adapter. In BDD integrations,
   * this is usually called by `beforEach()`
   */
  addSetup(op: TestOperation): void;

  /**
   * Actually run a test. This evaluates all setup operations, and then after those have completed
   * it runs the body of the test itself.
   */
  runTest(body: TestOperation): Future<Result<void>>;

  /**
   * Teardown this test adapter and all of the task and resources that are running inside it.
   * This basically destroys the Effection `Scope` associated with this adapter.
   */
  destroy(): Future<void>;
}

export interface TestAdapterOptions {
  /**
   * The name of this test adapter which is handy for debugging.
   * Usually, you'll give this the same name as the current test
   * context. For example, when integrating with BDD, this would be
   * the same as
   */
  name?: string;
  /**
   * The parent test adapter. All of the setup from this adapter will be
   * run in addition to the setup of this adapter during `runTest()`
   */
  parent?: TestAdapter;
}

const anonymousNames: Iterator<string, never> = (function* () {
  let count = 1;
  while (true) {
    yield `anonymous test adapter ${count++}`;
  }
})();

/**
 * Create a new test adapter with the given options.
 */
export function createTestAdapter(
  options: TestAdapterOptions = {},
): TestAdapter {
  const setups: TestOperation[] = [];
  const { parent, name = anonymousNames.next().value } = options;

  const [scope, destroy] = createScope(parent?.scope);

  const adapter: TestAdapter = {
    parent,
    name,
    scope,
    setups,
    get lineage() {
      const lineage = [adapter];
      for (let current = parent; current; current = current.parent) {
        lineage.unshift(current);
      }
      return lineage;
    },
    get fullname() {
      return adapter.lineage.map((adapter) => adapter.name).join(" > ");
    },
    addSetup(op) {
      setups.push(op);
    },
    runTest(op) {
      return scope.run(function* () {
        const allSetups = adapter.lineage.reduce(
          (all, adapter) => all.concat(adapter.setups),
          [] as TestOperation[],
        );
        try {
          for (const setup of allSetups) {
            yield* setup();
          }
          yield* op();
          return Ok<void>(void 0);
        } catch (error) {
          return Err(error as Error);
        }
      });
    },
    destroy,
  };

  return adapter;
}