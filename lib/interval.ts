import { resource } from "./resource.ts";
import { createSignal } from "./signal.ts";
import type { Stream } from "./types.ts";

/**
 * Consume an interval as an infinite stream.
 *
 * ```ts
 * let startTime = Date.now();
 *
 * for (let _ of yield* each(interval(10))) {
 *   let elapsed = Date.now() - startTime;
 *   console.log(`elapsed time: ${elapsed} ms`);
 *   yield* each.next();
 * }
 * ```
 * @param milliseconds - how long to delay between each item in the stream
 * @since 3.6
 */
export function interval(milliseconds: number): Stream<void, never> {
  return resource(function* (provide) {
    let signal = createSignal<void, never>();

    let id = setInterval(signal.send, milliseconds);

    try {
      yield* provide(yield* signal);
    } finally {
      clearInterval(id);
    }
  });
}
