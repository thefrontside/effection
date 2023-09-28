import type { Operation, Stream } from "./types.ts";

export function first<T>(stream: Stream<T, never>): Operation<T>;
export function* first<T>(
  stream: Stream<T, unknown>,
): Operation<T | undefined> {
  let subscription = yield* stream;
  let result = yield* subscription().next();

  if (!result.done) {
    return result.value;
  }
}
