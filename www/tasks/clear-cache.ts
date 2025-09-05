import type { Operation } from "effection";
import { $ } from "../context/shell.ts";
import { log } from "../context/logging.ts";
import { emptyDir } from "@std/fs";
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
    yield* until(emptyDir(cacheDir));
    yield* log.info("Successfully emptied web cache directory");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield* log.error(`Failed to empty cache directory: ${errorMessage}`);
    throw error;
  }
}

await main(clearCache);