import {
  call,
  main,
  resource,
  sleep,
  type Stream,
  stream,
  type Subscription,
} from "effection";

import { parse } from "https://deno.land/std@0.188.0/flags/mod.ts";

import { useCommand } from "./use-command.ts";

await main(function* () {
  let scriptargs = parse(Deno.args, {
    "--": true,
  });

  let paths = scriptargs["_"].map(String);
  let [cmd, ...args] = scriptargs["--"];

  let ignores = [".#"].concat(scriptargs.ignore ?? []);

  console.log(`watch: ${JSON.stringify(paths)}`);
  console.log(`run: ${cmd} ${args.join(" ")}`);

  while (true) {
    yield* call(function* () {
      let changes = yield* useFsWatch(paths);

      yield* useCommand(cmd, { args });

      while (true) {
        let { value: change } = yield* changes.next();
        if (
          !change.paths.some((path) =>
            ignores.some((ignore) => path.includes(ignore))
          )
        ) {
          break;
        }
      }
      yield* sleep(100);
      console.log("changes detected, restarting...");
    });
  }
});

function useFsWatch(paths: string | string[]): Stream<Deno.FsEvent, never> {
  return resource(function* (provide) {
    let watcher = Deno.watchFs(paths);
    try {
      let subscription = yield* stream(watcher);
      yield* provide(subscription as Subscription<Deno.FsEvent, never>);
    } finally {
      watcher.close();
    }
  });
}
