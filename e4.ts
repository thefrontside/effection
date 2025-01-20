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
import { staticalize } from "jsr:@frontside/staticalize@0.1.0";

function makeTempDir(options?: Deno.MakeTempOptions): Operation<string> {
  return call(() => Deno.makeTempDir(options));
}

type GenerateOptions = {
  host: URL;
  output: string;
} & PagefindServiceConfig;

const log = (first: unknown, ...args: unknown[]) =>
  console.log(`💪: ${first}`, ...args);

export function generate({ host, output, ...indexOptions }: GenerateOptions) {
  return async function () {
    return await run(function* () {
      const tmp = yield* makeTempDir();

      log(`Staticalizing: ${host} to ${tmp}`);

      yield* race([
        staticalize({
          host,
          base: host,
          dir: tmp,
        }),
        sleep(60000),
      ]);

      log("Adding index");
      
      const index = yield* createPagefindIndex(indexOptions);

      log(`Adding directory: ${tmp}`);

      const added = yield* index.addDirectory({ path: tmp });

      log(`Addedd ${added} pages from ${tmp}`);

      log(`Writing files ${output}`);
      return yield* index.writeFiles({ outputPath: output });
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
