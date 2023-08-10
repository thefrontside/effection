import type { Operation, Stream, Task } from "./types";
import { createChannel } from "./channel";
import { spawn } from "./instructions";

export function switchMap<A, B>(op: (a: A) => Operation<Stream<B, unknown>>) {
  return function <AClose>(stream: Stream<A, AClose>): Stream<B, AClose> {
    return {
      *[Symbol.iterator]() {
        const channel = createChannel<B, AClose>();

        yield* spawn(function* () {
          let innerTask: Task<unknown> | undefined;
          const final: AClose = yield* forEach(stream, function* (outer) {
            if (innerTask) {
              yield* innerTask.halt();
            }
            innerTask = yield* spawn(function* () {
              const innerStream = yield* op(outer);
              yield* forEach(innerStream, (inner) => channel.input.send(inner));
            });
          });
          yield* channel.input.close(final);
        });

        return yield* channel.output;
      },
    };
  };
}

// Can be replaced with for yield* each once it's available.
function* forEach<T, TClose>(
  stream: Stream<T, TClose>,
  fn: (a: T) => Operation<void>
): Operation<TClose> {
  const subcription = yield* stream;
  while (true) {
    const next = yield* subcription.next();
    if (next.done) {
      return next.value;
    } else {
      yield* fn(next.value);
    }
  }
}
