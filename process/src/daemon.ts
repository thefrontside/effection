import type { Operation } from "effection";

import { ProcessApi } from "../api.ts";
import type { ExecOptions, Process } from "./exec.ts";

/**
 * Start a long-running process, like a web server that run perpetually.
 * Daemon operations are expected to run forever, and if they exit pre-maturely
 * before the operation containing them passes out of scope it raises an error.
 */
export function daemon(
  command: string,
  options: ExecOptions = {},
): Operation<Process> {
  return ProcessApi.operations.daemon(command, options);
}
