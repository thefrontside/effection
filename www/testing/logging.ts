import { createQueue, type Queue, resource } from "effection";
import { loggerApi } from "../context/logging.ts";

const levels = ["info", "warn", "debug", "error"] as const;

type LogEvent =
  | { type: "info"; args: unknown[] }
  | { type: "warn"; args: unknown[] }
  | { type: "debug"; args: unknown[] }
  | { type: "error"; args: unknown[] };

export function* setupLogging(level: (typeof levels)[number] | false) {
  let queue = yield* resource<Queue<LogEvent, void>>(function* (provide) {
    let queue = createQueue<LogEvent, void>();
    try {
      yield* provide(queue);
    } finally {
      queue.close();
    }
  });

  if (level === false) {
    yield* loggerApi.around({
      *info() {},
      *debug() {},
      *warn() {},
      *error() {},
    });
    return;
  }
  yield* loggerApi.around({
    *info(args, next) {
      if (level === "info") {
        queue.add({ type: "info", args });
        return yield* next(...args);
      }
    },
    *warn(args, next) {
      if (level === "info" || level === "warn") {
        queue.add({ type: "warn", args });
        return yield* next(...args);
      }
    },
    *debug(args, next) {
      if (level === "info" || level === "warn" || level === "debug") {
        queue.add({ type: "debug", args });
        return yield* next(...args);
      }
    },
    *error(args, next) {
      if (
        level === "info" || level === "warn" || level === "debug" ||
        level === "error"
      ) {
        queue.add({ type: "error", args });
        return yield* next(...args);
      }
    },
  });

  return queue;
}
