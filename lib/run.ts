import type { Operation, Task } from "./types.ts";
import { createFrame, createFrameTask } from "./run/frame.ts";
export * from "./run/scope.ts";

export function run<T>(operation: () => Operation<T>): Task<T> {
  let frame = createFrame();
  let block = frame.run(operation);
  let task = createFrameTask(frame, block);
  block.enter();
  return task;
}
