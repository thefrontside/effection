import type { Operation } from "./types.ts";
import { resource } from "./instructions.ts";

export function useAbortSignal(): Operation<AbortSignal> {
  return resource(function* AbortSignal(provide) {
    let controller = new AbortController();
    try {
      yield* provide(controller.signal);
    } finally {
      controller.abort();
    }
  });
}
