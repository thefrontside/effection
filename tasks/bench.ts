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
} from "../mod.ts";
import { useWorker } from "./bench/worker.ts";
import scenarios from "./bench/scenarios.ts";
import type {
  BenchmarkDoneEvent,
  BenchmarkJsonOutput,
  BenchmarkOptions,
  BenchmarkResultEntry,
  BenchmarkStats,
  BenchmarkWorkerEvent,
  WorkerCommand,
} from "./bench/types.ts";

import { Cell, Row, Table } from "jsr:@cliffy/table@1.0.0-rc.7";
import { basename } from "jsr:@std/path";

interface BenchmarkCliOptions {
  include?: string;
  exclude?: string;
  repeat: number;
  depth: number;
  warmup: number;
  json: boolean;
}

await main(function* (args) {
  let options = parser()
    .name("bench")
    .description("Run Effection benchmarks")
    .version("0.0.0")
    .options({
      include: {
        type: z.string().optional(),
        description: "include only scenarios matching REGEXP",
      },
      exclude: {
        type: z.string().optional(),
        description: "exclude all scenarios matching REGEXP",
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
      warmup: {
        type: z.number().nonnegative().default(3),
        description: "number of warmup runs to discard",
        alias: "w",
      },
      json: {
        type: z.boolean().default(false),
        description: "output results as JSON",
      },
    })
    .parse(args) as BenchmarkCliOptions;

  let { include, exclude, repeat, depth, warmup, json } = options;

  let tasks: Task<BenchmarkDoneEvent>[] = [];

  for (let scenario of filter(scenarios, { include, exclude })) {
    tasks.push(
      yield* spawn(() =>
        runBenchmark(scenario, {
          type: "benchmark",
          repeat,
          depth,
          warmup,
        })
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

  if (json) {
    const output: BenchmarkJsonOutput = {
      metadata: {
        date: new Date().toISOString(),
        deno: Deno.version.deno,
        repeat,
        warmup,
        depth,
      },
      results: {
        recursion: recursion.map(toJsonEntry).filter(notNull),
        events: events.map(toJsonEntry).filter(notNull),
      },
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    renderTable(recursion, events, { repeat, warmup, depth });
  }
});

function renderTable(
  recursion: BenchmarkDoneEvent[],
  events: BenchmarkDoneEvent[],
  options: { repeat?: number; warmup?: number; depth?: number },
) {
  const headers = [
    "Library",
    "Avg",
    "Min",
    "Max",
    "StdDev",
    "p50",
    "p95",
    "p99",
  ];
  let rows = [];

  if (recursion.length > 0) {
    const title =
      `Basic Recursion (${options.repeat} reps, ${options.warmup} warmup, depth ${options.depth})`;
    rows.push(Row.from([new Cell(title).colSpan(headers.length).border()]));
    rows.push(Row.from<Cell | string>(headers).border());
    rows.push(...recursion.map((event) => Row.from(toTableRow(event))));
  }

  if (events.length > 0) {
    const title =
      `Recursive Events (${options.repeat} reps, ${options.warmup} warmup, depth ${options.depth})`;
    rows.push(Row.from([new Cell(title).colSpan(headers.length).border()]));
    rows.push(Row.from<Cell | string>(headers).border());
    rows.push(...events.map((event) => Row.from(toTableRow(event))));
  }

  Table.from(rows).render();
}

function* runBenchmark(
  scenario: string,
  options: BenchmarkOptions,
): Operation<BenchmarkDoneEvent> {
  let results = createQueue<BenchmarkDoneEvent, never>();
  let worker = yield* useWorker<WorkerCommand, BenchmarkWorkerEvent>(scenario);

  yield* spawn(function* () {
    for (let event of yield* each(worker.errors)) {
      event.preventDefault();
      throw event.error;
      // Note: each.next() is unreachable after throw, but the loop will
      // terminate when the worker scope is destroyed
    }
  });

  yield* spawn(function* () {
    for (let event of yield* each(worker.messages)) {
      if (event.data.type === "done") {
        results.add(event.data);
      } else if (event.data.type === "closed") {
        if (!event.data.result.ok) {
          throw event.data.result.error;
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
    yield* worker.postMessage({ type: "close" });
  }
}

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
    const stats = event.result.value;
    return [
      name,
      formatMs(stats.avgTime),
      formatMs(stats.minTime),
      formatMs(stats.maxTime),
      formatMs(stats.stdDev),
      formatMs(stats.p50),
      formatMs(stats.p95),
      formatMs(stats.p99),
    ];
  } else {
    return [name, "❌", "", "", "", "", "", ""];
  }
}

function toJsonEntry(event: BenchmarkDoneEvent): BenchmarkResultEntry | null {
  let [name = event.name] = event.name.split(".");
  if (event.result.ok) {
    return {
      name,
      stats: event.result.value,
    };
  }
  return null;
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function formatMs(ms: number): string {
  return ms.toFixed(2);
}
