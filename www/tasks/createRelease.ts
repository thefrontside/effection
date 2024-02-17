import { Stream, call, each, main, spawn, all } from "effection";
import { useCommand } from "../lib/useCommand.ts";
import { useEnv } from "../lib/useEnv.ts";
import { initKv } from "../lib/kv/initKv.ts";
import { withDeno } from "../lib/useDeno.ts";
import { type Operation } from "effection";
import { assert } from "https://deno.land/std@0.216.0/assert/assert.ts";
import { useWalk } from "../lib/useWalk.ts";
import { WalkEntry } from "https://deno.land/std@0.216.0/fs/walk.ts";
import { useKv } from "../lib/kv/useKv.ts";
import { useReadTextFile } from "../lib/useReadTextFile.ts";

const KV_URL =
  "https://api.deno.com/databases/2b605a51-5827-4718-bcc5-5adca69f87a5/connect";

export function* createRelease(): Operation<void> {
  const env = yield* useEnv();

  const refName = env.get("GITHUB_REF_NAME");
  assert(refName, `Missing GITHUB_REF_NAME environment variable`);
  const version = refName.replace("effection-v", "");
  
  // DENO_KV_URL is only set when running in CI or locally
  // when running in Deno Deploy, it doesn't need the URL.
  // @see https://docs.deno.com/deploy/kv/manual#opening-a-database
  yield* initKv(env.get('DENO_KV_URL') ?? KV_URL);
  
  yield* useCommand(`deno doc --html --name=effection@${version} mod.ts`);

  yield* useCommand(`tar cfvz api-docs.tgz -C docs .`);

  const entries = yield* useWalk("docs");
  
  const writeManifest = spawn(writeVersionManifest(version, entries));

  const writeApiDocs = spawn(writeVersionDocs(version, entries));

  yield* all([writeManifest, writeApiDocs]);
}

function writeVersionManifest(version: string, entries: Stream<WalkEntry, unknown>) {
  return function* () {
    const kv = yield* useKv();

    const manifest = new Map<string, WalkEntry>();

    for (let entry of yield * each(entries)) {
      manifest.set(entry.path, {
        ...entry
      });
      yield * each.next();
    }

    yield* call(() =>
      kv.set(["versions", version, "api-docs-manifest"], manifest),
    );
  }
}

function writeVersionDocs(version: string, entries: Stream<WalkEntry, unknown>) {
  return function*() {
    const kv = yield* useKv();

    for (let entry of yield * each(entries)) {
      if (entry.isFile) {
        try {
          const text = yield* useReadTextFile(entry.path); 
          yield* call(() => kv.set(["api-docs", version, entry.path], text))
        } catch (e) {
          console.error(`Failed to write api-docs file at ${entry.path} to KV. Encountered error ${e}`,);
        }
      }
      yield * each.next();
    }
  }
}

if (import.meta.main) {
  // this was loaded as the main module, maybe do some bootstrapping
  await main(function*() {
    yield* withDeno(createRelease);
  });
}