import { Stream } from 'effection';

/**
 * A slice represents a piece of the atom. Each part of the state can be
 * updated and retrieved. Any update will cause the entire state of the atom to
 * be updated.
 */
export interface Slice<S> extends Stream<S> {
  /**
   * Retrieve the current value of the slice
   */
  get(): S;
  /**
   * Set the value of the slice to the given value
   */
  set(value: S): void;
  /**
   * Update the value of the slice with the given function. The function takes
   * the current value as an argument and should return the new value.
   *
   * @param fn a function which updates the state
   */
  update(fn: (state: S) => S): void;
  /**
   * Return a new {@link Slice} for the given path.
   */
  slice: MakeSlice<S>;
  /**
   * Remove this slice from its parent
   */
  remove(): void;
  /**
   * Return a stream for this slice. Convenient for destructuring assignment.
   *
   * ### Example
   *
   * ```typescript
   * import { main } from 'effection';
   * import { createAtom } from '@effection/atom';
   *
   * main(function*() {
   *   let { stream, set } = createAtom(0);
   *
   *   yield spawn(stream.forEach((number) => console.log(number)));
   *   set(1);
   * });
   * ```
   */
  stream: Stream<S>;
}

export interface MakeSlice<S> {
  /*
  * Brute foce overload to allow strong typing of the string path syntax
  * for every level deep we want to go in the slice there will need to be an overload
  * with an argument for each of the string paths
  *
  * e.g. atom.slice('agents', agentId);  // 2 levels deep
  *
  * There must be a matching overload
  *
  * slice<Key1 extends keyof S, Key2 extends keyof S[Key1]>(key1: Key1, key2: Key2): Slice<S[Key1][Key2], S>;
  *
  * key1 is 'agents' and key2 is agentId.
  *
  * key1 is constrained to be a key of the atom `agents` which is atom.agents or could be
  * atom.manifest or atom.testRuns of Slice<OrchestratorState>
  *
  * key2 is constrained to be a key of the return type S[Key1] which is the agents object and in this
  * example whatever the agentId variable is
  *
  * The return type of the function is Slice<S[Key1][Key2], S>; or Slice<AgentState>
  * in this example
  */
 (): S;
 <
  Key extends keyof S
 >(
    key: Key
 ):
  Slice<S[Key]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1]
 >(
    key1: Key1, key2: Key2
  ):
  Slice<S[Key1][Key2]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2]
 >(
    key1: Key1, key2: Key2, key3: Key3
  ):
  Slice<S[Key1][Key2][Key3]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2],
  Key4 extends keyof S[Key1][Key2][Key3]
 >(
    key1: Key1, key2: Key2, key3: Key3, key4: Key4
  ):
  Slice<S[Key1][Key2][Key3][Key4]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2],
  Key4 extends keyof S[Key1][Key2][Key3],
  Key5 extends keyof S[Key1][Key2][Key3][Key4]
 >(
   key1: Key1, key2: Key2, key3: Key3, key4: Key4, key5: Key5
  ):
  Slice<S[Key1][Key2][Key3][Key4][Key5]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2],
  Key4 extends keyof S[Key1][Key2][Key3],
  Key5 extends keyof S[Key1][Key2][Key3][Key4],
  Key6 extends keyof S[Key1][Key2][Key3][Key4][Key5]
 >(
   key1: Key1, key2: Key2, key3: Key3, key4: Key4, key5: Key5, key: Key6
  ):
  Slice<S[Key1][Key2][Key3][Key4][Key5][Key6]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2],
  Key4 extends keyof S[Key1][Key2][Key3],
  Key5 extends keyof S[Key1][Key2][Key3][Key4],
  Key6 extends keyof S[Key1][Key2][Key3][Key4][Key5],
  Key7 extends keyof S[Key1][Key2][Key3][Key4][Key5][Key6]
 >(key1: Key1, key2: Key2, key3: Key3, key4: Key4, key5: Key5, key: Key6, key7: Key7):
  Slice<S[Key1][Key2][Key3][Key4][Key5][Key6][Key7]>;
 <
  Key1 extends keyof S,
  Key2 extends keyof S[Key1],
  Key3 extends keyof S[Key1][Key2],
  Key4 extends keyof S[Key1][Key2][Key3],
  Key5 extends keyof S[Key1][Key2][Key3][Key4],
  Key6 extends keyof S[Key1][Key2][Key3][Key4][Key5],
  Key7 extends keyof S[Key1][Key2][Key3][Key4][Key5][Key6],
  Key8 extends keyof S[Key1][Key2][Key3][Key4][Key5][Key6][Key7]
 >(
   key1: Key1, key2: Key2, key3: Key3, key4: Key4, key5: Key5, key: Key6, key7: Key7, key8: Key8
  ):
  Slice<S[Key1][Key2][Key3][Key4][Key5][Key6][Key7][Key8]>;
}
