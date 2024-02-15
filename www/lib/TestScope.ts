import { run, type Operation } from "effection";
/**
 * Source https://gist.github.com/cowboyd/70e4596e61aadafd852f403dc6d8ec6f#file-01-test-scope-ts
 */
export interface TestScope {
  /**
   * Call from your runner's "beforeEach" or equivalent
   */
  addSetup(op: () => Operation<void>): void;

  /**
   * Call from runner's `it()` or equivalent;
   */
  runTest(op: () => Operation<void>): Promise<void>;
}

export function createTestScope(): TestScope {
  let setup = [] as Array<() => Operation<void>>;

  return {
    addSetup(op) {
      setup.push(op);
    },

    runTest(op) {
      return run(function* () {
        for (let step of setup) {
          yield* step();
        }
        yield* op();
      });
    },
  };
}
