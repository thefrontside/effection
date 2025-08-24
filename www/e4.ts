import {
  call,
  type Operation,
  race,
  resource,
  run,
  sleep,
} from "npm:effection@4.0.0-alpha.4";
import {
  close,
  createIndex,
  PagefindIndex,
  PagefindServiceConfig,
  SiteDirectory,
  WriteOptions,
} from "npm:pagefind@1.3.0";
import { staticalize } from "jsr:@frontside/staticalize@0.2.0";
import * as fs from "jsr:@std/fs@1";

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
      const built = new URL(publicDir, import.meta.url);

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

      const index = yield* createPagefindIndex(indexOptions);

      log(`Adding directory: ${built.pathname}`);

      const added = yield* index.addDirectory({ path: built.pathname });

      log(`Addedd ${added} pages from ${built.pathname}`);

      log(`Writing files ${pagefindDir}`);
      return yield* index.writeFiles({ outputPath: pagefindDir });
    });
  };
}

export class EPagefindIndex {
  constructor(private readonly index: PagefindIndex) {}

  *addDirectory(path: SiteDirectory): Operation<number> {
    const response = yield* call(() => this.index.addDirectory(path));
    if (response.errors.length > 0) {
      console.error(
        `Encountered errors while adding ${path.path}: ${response.errors.join()}`,
      );
    }
    return response.page_count;
  }

  *writeFiles(options?: WriteOptions): Operation<string> {
    const response = yield* call(() => this.index.writeFiles(options));
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
    const { errors, index } = yield* call(() => createIndex(config));

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
