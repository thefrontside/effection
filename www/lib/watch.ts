import {
  action,
  filter,
  type Operation,
  pipe,
  resource,
  run,
  sleep,
  type Stream,
  stream,
  type Subscription,
} from "effection";

import { parse } from "https://deno.land/std@0.188.0/flags/mod.ts";

await run(function* () {
  let scriptargs = parse(Deno.args, {
    "--": true,
  });

  let paths = scriptargs["_"].map(String);
  let [cmd, ...args] = scriptargs["--"];

  console.log(`watch: ${JSON.stringify(paths)}`);
  console.log(`run: ${cmd} ${args.join(" ")}`);

  yield* action<void>(function* (resolve) {
    Deno.addSignalListener("SIGINT", resolve);
    try {
      while (true) {
        yield* action(function* (restart) {
          let changes = yield* pipe(
            useFsWatch(paths),
            filter(function* (event) {
              return !event.paths.some((path) => path.includes(".#"));
            }),
          );

          yield* useCommand(cmd, { args });

          yield* changes.next();

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

function useCommand(
  cmd: string,
  options?: Deno.CommandOptions,
): Operation<Deno.ChildProcess> {
  return resource(function* (provide) {
    let command = new Deno.Command(cmd, options);
    let process = command.spawn();
    try {
      yield* provide(process);
    } finally {
      try {
        process.kill("SIGINT");
      } catch (error) {
        // if the process already quit, then this error is expected.
        // unfortunately there is no way (I know of) to check this
        // before calling process.kill()

        if (
          !!error &&
          !error.message.includes("Child process has already terminated")
        ) {
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      }
    }
  });
}
