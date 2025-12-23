import { Operation, until } from "effection";

import * as fs from "@std/fs";

export function exists(
  path: string | URL,
  options?: fs.ExistsOptions,
): Operation<boolean> {
  return until(fs.exists(path, options));
}
