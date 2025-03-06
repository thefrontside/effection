import { callcc } from "../../../lib/callcc.ts";
import { Err, Ok } from "../../../lib/result.ts";
import { encapsulate } from "../../../lib/task.ts";
import {
  call,
  createChannel,
  each,
  main,
  type Operation,
  race,
  spawn,
  withResolvers,
} from "../../../mod.ts";
import type {
  BenchmarkOptions,
  BenchmarkWorkerEvent,
  WorkerCommand,
} from "../types.ts";
import { messages } from "../worker.ts";

const commands = messages<WorkerCommand>();

const send = (event: BenchmarkWorkerEvent) => self.postMessage(event);

export function scenario(
  name: string,
  perform: (depth: number, exit: (time: number) => void) => Operation<void>,
) {
  return main(function* () {
    try {
      yield* encapsulate(() =>
        callcc<void>(function* (exit) {
          let work = createChannel<BenchmarkOptions, never>();
          yield* spawn(function* () {
            for (let command of yield* each(commands)) {
              if (command.type === "close") {
                yield* exit();
              } else {
                yield* work.send(command);
              }
              yield* each.next();
            }
          });

          for (let options of yield* each(work)) {
            let times: number[] = [];
            let entryTimes: number[] = [];

            for (let i = 0; i < options.repeat; i++) {
              let start = performance.now();

              const exit = withResolvers<number | null>();

              const task = yield* spawn(function* () {
                yield* encapsulate(() => perform(options.depth, exit.resolve));
              });

              // Avoid blocking indefintely because not all benchmarks need the exit function
              yield* race([
                exit.operation,
                call(function* () {
                  yield* task;
                  exit.resolve(null);
                }),
              ]);

              const entryTime = yield* exit.operation;

              let time = performance.now() - start;
              send({ type: "repeat", name, time, rep: i + 1 });
              times.push(time);

              if (entryTime) {
                entryTimes.push(entryTime - start);
              }
            }

            let total = times.reduce((sum, time) => sum + time, 0);
            let avgTime = total / times.length;

            let startupTime = entryTimes.reduce((sum, time) => sum + time, 0);

            let avgStartupTime =
              entryTimes.length > 0 ? startupTime / entryTimes.length : 0;

            let result = Ok({ avgTime, avgStartupTime, reps: options.repeat });

            send({ type: "done", name, result });

            yield* each.next();
          }
        }),
      );
    } catch (error) {
      send({ type: "done", name, result: Err(error as Error) });
    } finally {
      send({ type: "close", result: Ok() });
    }
  });
}
