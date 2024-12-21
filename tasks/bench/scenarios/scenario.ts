import { callcc } from "../../../lib/callcc.ts";
import { Err, Ok } from "../../../lib/result.ts";
import { encapsulate } from "../../../lib/task.ts";
import { createChannel, each, main, type Operation, spawn } from "../../../mod.ts";
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
  perform: (depth: number) => Operation<void>,
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
            for (let i = 0; i < options.repeat; i++) {
              let start = performance.now();

              yield* encapsulate(() => perform(options.depth));

              let time = performance.now() - start;
              send({ type: "repeat", name, time, rep: i + 1 });
              times.push(time);
            }

            let total = times.reduce((sum, time) => sum + time, 0);
            let avgTime = total / times.length;
            let result = Ok({ avgTime, reps: options.repeat });

            send({ type: "done", name, result });

            yield* each.next();
          }
        })
      );
    } catch (error) {
      send({ type: "done", name, result: Err(error as Error) });
    } finally {
      send({ type: "close", result: Ok() });
    }
  });
}
