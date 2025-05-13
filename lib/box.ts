import { Err, Ok, type Result } from "./result.ts";
import type { Operation } from "./types.ts";

export function* box<T>(op: () => Operation<T>): Operation<Result<T>> {
  try {
    return Ok(yield* op());
  } catch (error) {
    return Err(error as Error);
  }
}
