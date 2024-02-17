import { KvContext } from "./KvContext.ts";

export function* useKv() {
  return yield* KvContext;
}
