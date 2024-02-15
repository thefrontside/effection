import { call, createContext, resource } from 'effection';

const KV_URL = "https://api.deno.com/databases/2b605a51-5827-4718-bcc5-5adca69f87a5/connect";

const KvContext = createContext<Deno.Kv>("Deno.Kv")

export function* openKv() {
  return (
    yield *
    resource<Deno.Kv>(function* (provide) {
      const kv = yield* call(() => Deno.openKv(KV_URL));
      try {
        yield* provide(kv);
      } finally {
        kv.close();
      }
    })
  );
}

export function* useKv() {
  yield* KvContext;
}