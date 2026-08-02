import { dirname, join } from "node:path";
import {
  emptyDir,
  exists,
  fromFileUrl,
  globToRegExp,
  toFileUrl,
  walk,
} from "./fs-helpers.ts";
import { JsonParseStream, TextLineStream } from "./stream-helpers.ts";

import {
  stream,
  type Operation,
  type Stream,
  call,
  createChannel,
  createQueue,
  each,
  ensure,
  resource,
  spawn,
} from "effection";
import type { Store, StoreConstructorOptions } from "./types.ts";

import fs from "node:fs";
import * as fsp from "node:fs/promises";
import { Readable } from "node:stream";

function* mkdir(
  path: fs.PathLike,
  options: fs.MakeDirectoryOptions & {
    recursive: true;
  },
): Operation<string | undefined> {
  return yield* call(() => fsp.mkdir(path, options));
}

export class JSONLStore implements Store {
  location: URL;
  constructor(location: URL) {
    this.location = location;
  }

  /**
   * Creates a store with a location that has a trailing slash.
   * The trailing slash is important to ensure that the store content
   * is written to the store directory and not the directory above which
   * can be very annoying. The location has to be absolute.
   * ```ts
   * const store = JSONLStore.from({ location: 'file:///Users/foo/.store/' })
   * ```
   *
   * @param options StoreConstructorOptions
   * @returns
   */
  static from(options: StoreConstructorOptions): JSONLStore {
    const pathname =
      options.location instanceof URL
        ? options.location.pathname
        : options.location;

    if (pathname.charAt(-1) === "/") {
      return new JSONLStore(toFileUrl(pathname));
    }
    return new JSONLStore(toFileUrl(`${pathname}/`));
  }

  /**
   * Returns true when key is present
   * ```ts
   * import { useStore } from "jsr:@effectionx/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * if (yield* store.has("test")) {
   *  console.log("store exists");
   * }
   * ```
   *
   * @param key string
   * @returns boolean
   */
  *has(key: string): Operation<boolean> {
    const location = new URL(`./${key}.jsonl`, this.location);

    return yield* call(async () => {
      try {
        return await exists(location);
      } catch {
        return false;
      }
    });
  }

  /**
   * Returns content of a file as a stream
   *
   * ```ts
   * import { each } from "npm:effection@^3";
   * import { useStore } from "jsr:@effectionx/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * for (const item of yield* each(store.read<number>("test"))) {
   *   console.log(item)
   *   yield* each.next();
   * }
   * ```
   *
   * @param key string
   * @returns Stream<T>
   */
  read<T>(key: string): Stream<T, void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    return resource(function* (provide) {
      const channel = createChannel<T, void>();

      const fileStream = fs.createReadStream(fromFileUrl(location));
      const webStream = Readable.toWeb(fileStream);

      // biome-ignore lint/suspicious/noExplicitAny: Node stream type incompatibility
      const lines = (webStream as any)
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeThrough(new JsonParseStream());

      yield* spawn(function* () {
        const reader = lines.getReader();

        yield* ensure(function* () {
          reader.releaseLock();
          yield* channel.close();
        });

        while (true) {
          const { done, value } = yield* call(() => reader.read());
          yield* channel.send(value as T);
          if (done) break;
        }
      });

      yield* provide(yield* channel);
    });
  }

  /**
   * Write data to a file, creates the file and necessary directory structure as it goes along.
   *
   * ```ts
   * import { useStore } from "jsr:@effectionx/jsonl-store";
   *
   * const store = yield* useStore();
   * yield* store.write("hello", "world");
   * ```
   * @param key string
   * @param data unknown
   */
  *write(key: string, data: unknown): Operation<void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    yield* mkdir(dirname(fromFileUrl(location)), { recursive: true });

    yield* call(() =>
      fsp.writeFile(fromFileUrl(location), `${JSON.stringify(data)}\n`, {
        encoding: "utf-8",
      }),
    );
  }

  /**
   * Add data to an existing file.
   *
   * ```ts
   * import { useStore } from "jsr:@effectionx/jsonl-store";
   *
   * const store = yield* useStore();
   * yield* store.write("hello", "world");
   * yield* store.append("hello", "from bob");
   * ```
   * @param key string
   * @param data
   */
  *append(key: string, data: unknown): Operation<void> {
    const location = new URL(`./${key}.jsonl`, this.location);

    yield* call(() =>
      fsp.appendFile(fromFileUrl(location), `${JSON.stringify(data)}\n`, {
        encoding: "utf-8",
      }),
    );
  }

  /**
   * Returns a stream of content from all files matching a glob
   *
   * ```ts
   * import { each } from "npm:effection@^3";
   * import { useStore } from "jsr:@effectionx/jsonl-store";
   *
   * const store = yield* useStore();
   *
   * for (const item of yield* each(store.find<number>("subdir/*"))) {
   *   console.log(item);
   *    yield* each.next();
   * }
   * ```
   *
   * @param glob string
   * @returns Stream<T, void>
   */
  find<T>(glob: string): Stream<T, void> {
    const root = fromFileUrl(this.location);

    const reg = globToRegExp(join(root, glob), {
      globstar: true,
    });

    const files = walk(root, {
      includeDirs: false,
      includeFiles: true,
      match: [reg],
    });

    const read = this.read.bind(this);

    return resource(function* (provide) {
      const queue = createQueue<T, void>();

      yield* spawn(function* () {
        for (const file of yield* each(stream(files))) {
          const key = file.path
            .replace(root, "")
            .replaceAll("\\", "/")
            .replace(/\.jsonl$/, "");

          for (const item of yield* each(read<T>(key))) {
            queue.add(item);
            yield* each.next();
          }

          yield* each.next();
        }

        queue.close();
      });

      yield* provide(queue);
    });
  }

  *clear(): Operation<void> {
    yield* call(() => emptyDir(this.location));
  }
}
