import { call, spawn, Task } from "effection";
import { GET } from "revolution";

import { assetsRoute } from "./assets-route.ts";
import { generate } from "../e4.ts";
import { exists } from "../lib/fs.ts";

export function pagefindRoute(
  { pagefindDir, publicDir }: { pagefindDir: string; publicDir: string },
) {
  const assets = assetsRoute(pagefindDir);
  let task: Task<void>;
  return GET<Response>(function* (request, next) {
    if (!((yield* exists(publicDir)) && (yield* exists(pagefindDir)))) {
      if (!task) {
        const host = new URL(new URL(request.url).origin);
        task = yield* spawn(function* () {
          yield* call(generate({
            host,
            publicDir,
            pagefindDir,
            rootSelector: "main",
          }));
        });
      }
      yield* task;
    }
    return yield* assets(request, next);
  });
}
