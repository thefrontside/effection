import { Stream } from 'effection';

export type NestedIndex<T, K extends [keyof T, ...unknown[]]> =
  keyof T[K[0]] extends never
    ? []
    : K extends [K[0], infer A, ...infer R]
      ? [A] extends [keyof T[K[0]]]
        ? [keyof T[K[0]], ...NestedIndex<T[K[0]], [A, ...R]>]
        : [keyof T[K[0]], ...never[]]
      : [];

export type ResolveKeys<T, K extends unknown[]> =
  K extends []
    ? T
    : K extends [infer H, ...infer R]
      ? { [P in H & keyof T ]: ResolveKeys<T[P], R> }[H & keyof T]
      : unknown;

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
  slice<K extends [keyof S, ...NestedIndex<S, K>]>(...path: K): Slice<ResolveKeys<S, K>>;
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
