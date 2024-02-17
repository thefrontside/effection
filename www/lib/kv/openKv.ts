import { call, resource } from "effection";


export function* openKv(path?: string) {
  return (
    yield* resource<Deno.Kv>(function* (provide) {
      const kv = yield* call(() => Deno.openKv(path));
      try {
        yield* provide(kv);
      } finally {
        kv.close();
      }
    })
  );
}
