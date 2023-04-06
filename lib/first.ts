import type { Operation, Stream } from "./types.ts";

export function* first<T>(stream: Stream<T, void>): Operation<T | undefined> {
  let events = yield* stream;
  for (let next = yield* events; !next.done; next = yield* events) {
    return next.value;
  }
}
