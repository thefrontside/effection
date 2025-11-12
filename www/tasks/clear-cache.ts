import type { Operation } from "effection";
import { $ } from "../context/shell.ts";
import { log } from "../context/logging.ts";
import { until, main } from "effection";

export function* clearCache(): Operation<void> {
  yield* log.info("🧹 Starting cache clear operation");

  const denoInfoResult = yield* $("deno info");
  yield* log.info("Retrieved Deno cache information");

  const cacheMatch = denoInfoResult.stdout.match(/Web cache storage:\s*(.+)/);
  if (!cacheMatch) {
    yield* log.error("Could not find web cache directory in deno info output");
    return;
  }

  const cacheDir = cacheMatch[1].trim();
  yield* log.info(`Found web cache directory: ${cacheDir}`);

  try {
    yield* until(Deno.remove(cacheDir, { recursive: true }));
    yield* log.info("Successfully deleted web cache directory");

    yield* until(Deno.mkdir(cacheDir, { recursive: true }));
    yield* log.info("Recreated web cache directory");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield* log.error(`Failed to clear cache directory: ${errorMessage}`);
    throw error;
  }
}

await main(clearCache);