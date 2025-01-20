import { call, Operation, spawn, Task } from "effection";
import { GET } from "revolution";
import * as fs from "jsr:@std/fs@1";

import { assetsRoute } from "./assets-route.ts";
import { generate } from "../e4.ts";

function exists(
  path: string | URL,
  options?: fs.ExistsOptions,
): Operation<boolean> {
  return call(() => fs.exists(path, options));
}

export function pagefindRoute({ pagefindDir }: { pagefindDir: string }) {
  const assets = assetsRoute(pagefindDir);
  let task: Task<void>;
  return GET<Response>(function* (request, next) {
    if (yield* exists(pagefindDir)) {
      return yield* assets(request, next);
    }
    if (!task) {
      const host = new URL(new URL(request.url).origin);
      task = yield* spawn(function* () {
        yield* call(generate({ 
          host, 
          output: pagefindDir,
          rootSelector: "main"
        }));
      });
    }
    yield* task;
    return yield* assets(request, next);
  });
}
