import type { Operation, Task } from "./types.ts";
import { createFrame } from "./run/frame.ts";
export * from "./run/scope.ts";

export function run<T>(operation: () => Operation<T>): Task<T> {
  let frame = createFrame<T>({ operation });
  return frame.enter();
}
