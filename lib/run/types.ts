import type { Result } from "../types.ts";

export type Exit<T> = {
  type: "aborted";
} | {
  type: "crashed";
  error: Error;
} | {
  type: "result";
  result: Result<T>;
};

/**
 * @ignore
 */
export type FrameResult<T> = Result<void> & {
  exit: Exit<T>;
};
