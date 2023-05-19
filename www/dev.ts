import {
  action,
  sleep,
  stream,
  run,
  spawn,
  suspend,
  resource,
  pipe,
  filter,
  type Stream,
  type Subscription,
} from "effection";

import { useServer } from "freejack/server.ts";
import { main } from "./routes/main.tsx";

await run(function* () {

  yield* action<void>(function* (resolve) {

    yield* spawn(function*() {
      while (true) {
        yield* action<void>(function*(restart) {

          let changes = yield* pipe(useFsWatch(["./routes", "docs"]), filter(function*(event) {
            return !event.paths.some(path => path.includes(".#"));
          }));

          let server = yield* useServer({
            app: main,
            port: 8088,
          });

          console.log(`freejack -> https://${server.hostname}:${server.port}`);

          yield* changes.next();

          yield* sleep(100);

          console.log('detected file changes. restarting....');
          restart();
        })
      }
    });



    Deno.addSignalListener("SIGINT", resolve);
    try {
      yield* suspend();
    } finally {
      Deno.removeSignalListener("SIGINT", resolve);
    }
  });

  console.log("exiting...");
});

function useFsWatch(paths: string | string[]): Stream<Deno.FsEvent, never> {
  return resource(function*(provide) {
    let watcher = Deno.watchFs(paths);
    try {
      let subscription = yield* stream(watcher);
      yield* provide(subscription as Subscription<Deno.FsEvent, never>);
    } finally {
      watcher.close();
    }
  });
}
