import { call, Operation } from "effection";

import * as fs from "jsr:@std/fs@1";

export function exists(
  path: string | URL,
  options?: fs.ExistsOptions,
): Operation<boolean> {
  return call(() => fs.exists(path, options));
}