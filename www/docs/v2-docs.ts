import { call, useAbortSignal } from "effection";
import type { Operation, Task } from "effection";
import { each, spawn, stream, useScope } from "effection";
import { Foras, GzDecoder } from "npm:@hazae41/foras@2.1.1";
import { Untar } from "https://deno.land/std@0.203.0/archive/untar.ts";
import type { TarEntry } from "../routes/serve-tar.ts";

export interface V2Docs {
  website: {
    prod: Operation<Map<string, TarEntry>>;
    local: Operation<Map<string, TarEntry>>;
  };
  apidocs: Operation<Map<string, TarEntry>>;
}

export interface V2DocsOptions {
  fetchEagerly?: boolean;
  revision: number | {
    website: number | {
      local: number | string;
      prod: number | string;
    };
    apidocs: number | string;
  };
}

export function* loadV2Docs(options: V2DocsOptions): Operation<V2Docs> {
  let urls = getUrls(options);

  let gzInit = yield* lazy(() => call(Foras.initBundledOnce()));

  let start = options.fetchEagerly ? spawn : lazy;

  let website = {
    prod: yield* start(() => loadTar(urls.website.prod, gzInit)),
    local: yield* start(() => loadTar(urls.website.local, gzInit)),
  };

  let apidocs = yield* start(() => loadTar(urls.apidocs, gzInit));

  return {
    website,
    apidocs,
  };
}

interface TarUrls {
  website: {
    local: string;
    prod: string;
  };
  apidocs: string;
}

// supports using a version number, or a hard-coded custom url for dev purposes
function getUrls({ revision }: V2DocsOptions): TarUrls {
  if (typeof revision === "number") {
    return {
      website: {
        local: getWebsiteUrl(revision, "local"),
        prod: getWebsiteUrl(revision, "prod"),
      },
      apidocs: getApiUrl(revision),
    };
  } else {
    let { website, apidocs } = revision;
    if (typeof website === "number") {
      return {
        website: {
          local: getWebsiteUrl(website, "local"),
          prod: getWebsiteUrl(website, "prod"),
        },
        apidocs: getApiUrl(apidocs),
      };
    } else {
      let { local, prod } = website;
      return {
        website: {
          local: getWebsiteUrl(local, "local"),
          prod: getWebsiteUrl(prod, "prod"),
        },
        apidocs: getApiUrl(apidocs),
      };
    }
  }
}

function getWebsiteUrl(revision: number | string, variant: "prod" | "local") {
  if (typeof revision === "number") {
    return `https://github.com/thefrontside/effection/releases/download/docs-v2-r${revision}/docs-v2-r${revision}.website.${variant}.tgz`;
  } else {
    return revision;
  }
}

function getApiUrl(revision: string | number): string {
  if (typeof revision === "number") {
    return `https://github.com/thefrontside/effection/releases/download/docs-v2-r${revision}/docs-v2-r${revision}.apidocs.tgz`;
  } else {
    return revision;
  }
}

function* loadTar(url: string, gzInit: Operation<unknown>) {
  yield* gzInit;
  let signal = yield* useAbortSignal();
  let response = yield* call(fetch(url, { signal }));
  if (response.ok) {
    let website = new Map<string, TarEntry>();
    if (response.body) {
      let gunzip = new GzDecoder();
      let reader = response.body.getReader();
      try {
        let next = yield* call(reader.read());
        while (!next.done) {
          gunzip.write(next.value);
          next = yield* call(reader.read());
        }
        gunzip.flush();
      } finally {
        yield* call(reader.cancel());
      }
      let tar = gunzip.finish().copyAndDispose();
      let bytesRead = 0;

      let untar = new Untar({
        read(buf) {
          let remaining = tar.length - bytesRead;
          let length = Math.min(remaining, buf.length);
          if (length === 0) {
            return Promise.resolve(null);
          }
          for (let i = 0; i < length; i++) {
            buf[i] = tar[bytesRead + i];
          }
          bytesRead += length;
          return Promise.resolve(length);
        },
      }) as AsyncIterable<TarEntry>;

      for (let entry of yield* each(stream(untar))) {
        if (entry.type === "directory" && entry.fileName.endsWith("/")) {
          entry.content = new Blob();
          website.set(entry.fileName.slice(0, -1), entry);
        } else {
          let parts: BlobPart[] = [];
          let buf = new Uint8Array(2048);
          try {
            while (true) {
              let bytesRead = yield* call(entry.read(buf));
              if (bytesRead == null) {
                break;
              } else {
                parts.push(buf.slice(0, bytesRead));
              }
            }
          } finally {
            yield* call(entry.discard());
          }
          entry.content = new Blob(parts);
          website.set(entry.fileName, entry);
        }
        yield* each.next();
      }
    }
    return website;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}

// spawn a task to evaluate the opertaion, but only when you first ask for the
// value
function lazy<T>(operation: () => Operation<T>): Operation<Operation<T>> {
  let task: Task<T> | void = void 0;

  return {
    *[Symbol.iterator]() {
      let scope = yield* useScope();
      return {
        *[Symbol.iterator]() {
          if (!task) {
            task = scope.run(operation);
          }
          return yield* task;
        },
      };
    },
  };
}
