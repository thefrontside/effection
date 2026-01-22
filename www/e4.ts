import {
  call,
  type Operation,
  race,
  resource,
  run,
  sleep,
  // deno-lint-ignore no-import-prefix
} from "npm:effection@4.0.0-alpha.4";

import {
  close,
  createIndex,
  PagefindIndex,
  PagefindServiceConfig,
  SiteDirectory,
  WriteOptions,
} from "pagefind";
import { staticalize } from "@frontside/staticalize";
import * as fs from "@std/fs";

function exists(path: string | URL, options?: fs.ExistsOptions) {
  return call(() => fs.exists(path, options));
}

type GenerateOptions = {
  host: URL;
  publicDir: string;
  pagefindDir: string;
} & PagefindServiceConfig;

const log = (first: unknown, ...args: unknown[]) =>
  console.log(`💪: ${first}`, ...args);

export function generate(
  { host, publicDir, pagefindDir, ...indexOptions }: GenerateOptions,
) {
  return async function () {
    return await run(function* () {
      let built = new URL(publicDir, import.meta.url);

      if (yield* exists(built, { isDirectory: true })) {
        log(`Reusing existing staticalized ${built.pathname} directory`);
      } else {
        log(`Staticalizing: ${host} to ${built.pathname}`);

        yield* race([
          staticalize({
            host,
            base: host,
            dir: built.pathname,
          }),
          sleep(60000),
        ]);
      }

      log("Adding index");

      let index = yield* createPagefindIndex(indexOptions);

      log(`Adding directory: ${built.pathname}`);

      let added = yield* index.addDirectory({ path: built.pathname });

      log(`Addedd ${added} pages from ${built.pathname}`);

      log(`Writing files ${pagefindDir}`);
      return yield* index.writeFiles({ outputPath: pagefindDir });
    });
  };
}

export class EPagefindIndex {
  constructor(private readonly index: PagefindIndex) {}

  *addDirectory(path: SiteDirectory): Operation<number> {
    let response = yield* call(() => this.index.addDirectory(path));
    if (response.errors.length > 0) {
      console.error(
        `Encountered errors while adding ${path.path}: ${response.errors.join()}`,
      );
    }
    return response.page_count;
  }

  *writeFiles(options?: WriteOptions): Operation<string> {
    let response = yield* call(() => this.index.writeFiles(options));
    if (response.errors.length > 0) {
      console.error(
        `Encountered errors while writing to ${options?.outputPath}: ${response.errors.join()}`,
      );
    }
    return response.outputPath;
  }
}

export function createPagefindIndex(config?: PagefindServiceConfig) {
  return resource<EPagefindIndex>(function* (provide) {
    let { errors, index } = yield* call(() => createIndex(config));

    if (!index) {
      throw new Error(`Failed to create an index: ${errors.join()}`);
    }

    try {
      yield* provide(new EPagefindIndex(index));
    } finally {
      yield* call(() => close());
    }
  });
}
