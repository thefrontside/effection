import { parser } from "npm:zod-opts";
import { z } from "npm:zod";
import {
  all,
  createQueue,
  each,
  main,
  type Operation,
  spawn,
  type Task,
  withResolvers,
} from "../mod.ts";
import { useWorker } from "./bench/worker.ts";
import scenarios from "./bench/scenarios.ts";
import type {
  BenchmarkDoneEvent,
  BenchmarkOptions,
  BenchmarkWorkerEvent,
  WorkerCommand,
} from "./bench/types.ts";
import { Ok } from "../lib/result.ts";

import { Cell, Row, Table } from "jsr:@cliffy/table@1.0.0-rc.7";

await main(function* (args) {
  let options = parser()
    .name("bench")
    .description(
      "Run Effection benchmarks",
    )
    .version("0.0.0")
    .options({
      include: {
        type: z.string().optional(),
        description: "include only scenarios matching REGEXP",
      },
      exclude: {
        type: z.string().optional(),
        description: "exclude all scenanios matching REGEXP",
      },
      repeat: {
        type: z.number().positive().default(10),
        description: "number of times to repeat",
        alias: "n",
      },
      depth: {
        type: z.number().positive().default(100),
        description: "number of levels of recursion to run",
        alias: "d",
      },
    })
    .parse(args);

  let { include, exclude } = options;

  let tasks: Task<BenchmarkDoneEvent>[] = [];

  for (let scenario of filter(scenarios, { include, exclude })) {
    tasks.push(
      yield* spawn(() =>
        runBenchmark(scenario, { ...options, type: "benchmark" })
      ),
    );
  }

  let results = yield* all(tasks);

  let events = results.filter((result) => result.name.match("events"));
  let recursion = results.filter((result) => result.name.match("recursion"));

  if (events.length == 0 && recursion.length === 0) {
    console.log("no benchmarks run");
    return;
  }

  let rows = [];

  if (recursion.length > 0) {
    rows.push(Row.from([new Cell("Basic Recursion").colSpan(2).border()]));
    rows.push(Row.from<Cell | string>(["Library", "Avg (ms)"]).border());
    rows.push(...recursion.map((event) => Row.from(toTableRow(event))));
  }

  if (events.length > 0) {
    rows.push(Row.from([new Cell("Recursive Events").colSpan(2).border()]));
    rows.push(Row.from<Cell | string>(["Library", "Avg (ms)"]).border());
    rows.push(...events.map((event) => Row.from(toTableRow(event))));
  }

  Table.from(rows).render();
});

function* runBenchmark(
  scenario: string,
  options: BenchmarkOptions,
): Operation<BenchmarkDoneEvent> {
  let results = createQueue<BenchmarkDoneEvent, never>();
  let closed = withResolvers<void>();
  let worker = yield* useWorker<WorkerCommand, BenchmarkWorkerEvent>(scenario);

  yield* spawn(function* () {
    for (let event of yield* each(worker.errors)) {
      event.preventDefault();
      throw event.error;
    }
  });

  yield* spawn(function* () {
    for (let event of yield* each(worker.messages)) {
      if (event.data.type === "done") {
        results.add(event.data);
      } else if (event.data.type === "close") {
        console.log(event.data);
        if (!event.data.result.ok) {
          throw event.data.result.error;
        } else {
          closed.resolve();
        }
      }
      yield* each.next();
    }
  });

  try {
    yield* worker.postMessage(options);
    let value = (yield* results.next()).value;
    return value;
  } finally {
    yield* worker.postMessage({ type: "close", result: Ok() });
  }
}

import { basename } from "jsr:@std/path";

function filter(
  strings: string[],
  options: { include?: string; exclude?: string },
): string[] {
  let { include, exclude } = options;
  let result = strings;
  if (include) {
    result = result.filter((s) => basename(s).match(new RegExp(include)));
  }
  if (exclude) {
    result = result.filter((s) => !basename(s).match(new RegExp(exclude)));
  }
  return result;
}

function toTableRow(event: BenchmarkDoneEvent): string[] {
  let [name = event.name] = event.name.split(".");
  if (event.result.ok) {
    let { avgTime } = event.result.value;
    return [name, String(avgTime)];
  } else {
    return [name, "❌"];
  }
}
