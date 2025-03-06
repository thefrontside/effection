import type { Result } from "../../lib/result.ts";

export type WorkerCommand = BenchmarkOptions | Close;

export interface BenchmarkOptions {
  type: "benchmark";
  repeat: number;
  depth: number;
}

export interface Close {
  type: "close";
  result: Result<void>;
}

export type BenchmarkWorkerEvent =
  | BenchmarkRepeatEvent
  | BenchmarkDoneEvent
  | Close;

export interface BenchmarkRepeatEvent {
  type: "repeat";
  name: string;
  rep: number;
  time: number;
}

export interface BenchmarkDoneEvent {
  type: "done";
  name: string;
  result: Result<{
    reps: number;
    avgTime: number;
    avgStartupTime: number;
  }>;
}
