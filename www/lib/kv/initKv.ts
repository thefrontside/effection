import { KvContext } from "./KvContext.ts";
import { openKv } from "./openKv.ts";

export function* initKv(path?: string) {
  const kv = yield* openKv(path);

  yield* KvContext.set(kv);
}
