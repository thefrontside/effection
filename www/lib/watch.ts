import {
  action,
  filter,
  first,
  pipe,
  resource,
  run,
  sleep,
  type Stream,
  stream,
  type Subscription,
} from "effection";

import { parse } from "https://deno.land/std@0.188.0/flags/mod.ts";

import { useCommand } from "./use-command.ts";

await run(function* () {
  let scriptargs = parse(Deno.args, {
    "--": true,
  });

  let paths = scriptargs["_"].map(String);
  let [cmd, ...args] = scriptargs["--"];

  let ignores = [".#"].concat(scriptargs.ignore ?? []);

  console.log(`watch: ${JSON.stringify(paths)}`);
  console.log(`run: ${cmd} ${args.join(" ")}`);

  yield* action<void>(function* (resolve) {
    Deno.addSignalListener("SIGINT", resolve);
    try {
      while (true) {
        yield* action(function* (restart) {
          let change = pipe(
            useFsWatch(paths),
            filter(function* (event) {
              return !event.paths.some((path) =>
                ignores.some((ignore) => path.includes(ignore))
              );
            }),
          );

          yield* useCommand(cmd, { args });

          yield* first(change);

          yield* sleep(100);

          console.log("changes detected, restarting...");

          restart();
        });
      }
    } finally {
      Deno.removeSignalListener("SIGINT", resolve);
    }
  });
});

function useFsWatch(paths: string | string[]): Stream<Deno.FsEvent, never> {
  return {
    subscribe() {
      return resource(function* (provide) {
        let watcher = Deno.watchFs(paths);
        try {
          let subscription = yield* stream(watcher).subscribe();
          yield* provide(subscription as Subscription<Deno.FsEvent, never>);
        } finally {
          watcher.close();
        }
      });
    },
  };
}
