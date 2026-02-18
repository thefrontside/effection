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
  BenchmarkStatsByKind,
  BenchmarkWorkerEvent,
  CancellationBenchmarkOptions,
  CancellationResultEntry,
  LegacyBenchmarkOptions,
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
  tasks: number;
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
      tasks: {
        type: z.number().positive().default(10),
        description: "number of concurrent tasks for cancellation benchmarks",
        alias: "t",
      },
      json: {
        type: z.boolean().default(false),
        description: "output results as JSON",
      },
    })
    .parse(args) as BenchmarkCliOptions;

  let { include, exclude, repeat, depth, warmup, tasks: taskCount, json } = options;

  let benchTasks: Task<BenchmarkDoneEvent>[] = [];

  for (let scenario of filter(scenarios, { include, exclude })) {
    // Determine if this is a cancellation benchmark
    const isCancellation = scenario.includes(".cancellation.");

    if (isCancellation) {
      // Cancellation benchmarks need the full CancellationBenchmarkOptions
      benchTasks.push(
        yield* spawn(() =>
          runBenchmark(scenario, {
            type: "benchmark",
            kind: "cancellation",
            repeat,
            depth,
            warmup,
            tasks: taskCount,
          })
        ),
      );
    } else {
      // Legacy benchmarks (recursion/events) use LegacyBenchmarkOptions
      benchTasks.push(
        yield* spawn(() =>
          runBenchmark(scenario, {
            type: "benchmark",
            repeat,
            depth,
            warmup,
          } as LegacyBenchmarkOptions)
        ),
      );
    }
  }

  let results = yield* all(benchTasks);

  let events = results.filter((result: BenchmarkDoneEvent) => result.name.match("events"));
  let recursion = results.filter((result: BenchmarkDoneEvent) => result.name.match("recursion"));
  let cancellation = results.filter((result: BenchmarkDoneEvent) => result.name.match("cancellation"));

  if (events.length === 0 && recursion.length === 0 && cancellation.length === 0) {
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
        ...(cancellation.length > 0 ? { tasks: taskCount } : {}),
      },
      results: {
        recursion: recursion.map(toJsonEntry).filter(notNull),
        events: events.map(toJsonEntry).filter(notNull),
        ...(cancellation.length > 0 ? {
          cancellation: cancellation.map(toCancellationJsonEntry).filter(notNull),
        } : {}),
      },
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    renderTable(recursion, events, cancellation, { repeat, warmup, depth, tasks: taskCount });
  }
});

function renderTable(
  recursion: BenchmarkDoneEvent[],
  events: BenchmarkDoneEvent[],
  cancellation: BenchmarkDoneEvent[],
  options: { repeat?: number; warmup?: number; depth?: number; tasks?: number },
) {
  const timingHeaders = [
    "Library",
    "Avg",
    "Min",
    "Max",
    "StdDev",
    "p50",
    "p95",
    "p99",
  ];

  const cancellationHeaders = [
    "Library",
    "Avg",
    "Min",
    "Max",
    "StdDev",
    "Alloc",
    "Released",
    "Leaked",
  ];

  let rows = [];

  if (recursion.length > 0) {
    const title =
      `Basic Recursion (${options.repeat} reps, ${options.warmup} warmup, depth ${options.depth})`;
    rows.push(Row.from([new Cell(title).colSpan(timingHeaders.length).border()]));
    rows.push(Row.from<Cell | string>(timingHeaders).border());
    rows.push(...recursion.map((event) => Row.from(toTableRow(event))));
  }

  if (events.length > 0) {
    const title =
      `Recursive Events (${options.repeat} reps, ${options.warmup} warmup, depth ${options.depth})`;
    rows.push(Row.from([new Cell(title).colSpan(timingHeaders.length).border()]));
    rows.push(Row.from<Cell | string>(timingHeaders).border());
    rows.push(...events.map((event) => Row.from(toTableRow(event))));
  }

  if (cancellation.length > 0) {
    const title =
      `Cancellation Cascade (${options.repeat} reps, ${options.warmup} warmup, ${options.tasks} tasks, depth ${options.depth})`;
    rows.push(Row.from([new Cell(title).colSpan(cancellationHeaders.length).border()]));
    rows.push(Row.from<Cell | string>(cancellationHeaders).border());
    rows.push(...cancellation.map((event) => Row.from(toCancellationTableRow(event))));
  }

  Table.from(rows).render();
}

function* runBenchmark(
  scenario: string,
  options: BenchmarkOptions | LegacyBenchmarkOptions,
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

function toCancellationJsonEntry(event: BenchmarkDoneEvent): CancellationResultEntry | null {
  let [name = event.name] = event.name.split(".");
  if (event.result.ok && "correctness" in event.result.value) {
    return {
      name,
      stats: event.result.value as BenchmarkStatsByKind["cancellation"],
    };
  }
  return null;
}

function toCancellationTableRow(event: BenchmarkDoneEvent): string[] {
  let [name = event.name] = event.name.split(".");
  if (event.result.ok) {
    const stats = event.result.value as BenchmarkStatsByKind["cancellation"];
    return [
      name,
      formatMs(stats.avgTime),
      formatMs(stats.minTime),
      formatMs(stats.maxTime),
      formatMs(stats.stdDev),
      String(stats.correctness.allocated),
      String(stats.correctness.released),
      stats.correctness.leaked === 0 ? "0" : `${stats.correctness.leaked}`,
    ];
  } else {
    return [name, "", "", "", "", "", "", ""];
  }
}

function notNull<T>(value: T | null): value is T {
  return value !== null;
}

function formatMs(ms: number): string {
  return ms.toFixed(2);
}
