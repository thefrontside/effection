import type { Operation } from "effection";
import { each, expect, resource, spawn, stream } from "effection";
import { Foras, GzDecoder } from "npm:@hazae41/foras@2.1.1";
import { Untar } from "https://deno.land/std@0.203.0/archive/untar.ts";
import { serveTar, type TarEntry } from "freejack/serve-tar.ts";
import type { ServeHandler } from "../lib/types.ts";

export interface V2Docs {
  serveWebsite: ServeHandler;
  serveApidocs: ServeHandler;
}

export interface UseV2DocsOptions {
  revision: number | {
    website: string;
    apidocs: string;
  };
}

const variant = Deno.env.get("V2_WEBSITE_VARIENT_PROD") ?? "local";

export function useV2Docs(options: UseV2DocsOptions): Operation<V2Docs> {
  return resource(function* (provide) {
    let { revision } = options;

    let websiteArchiveUrl = typeof revision === "number"
      ? `https://github.com/thefrontside/effection/releases/download/docs-v2-r${revision}/docs-v2-r${revision}.website.${variant}.tgz`
      : revision.website;
    let apidocsArchiveUrl = typeof revision === "number"
      ? `https://github.com/thefrontside/effection/releases/download/docs-v2-r${revision}/docs-v2-r${revision}.apidocs.tgz`
      : revision.apidocs;

    yield* expect(Foras.initBundledOnce());

    let website = yield* spawn(() => loadTar(websiteArchiveUrl));
    let apidocs = yield* spawn(() => loadTar(apidocsArchiveUrl));

    yield* provide({
      serveWebsite: {
        *middleware(_, request) {
          return yield* expect(serveTar(request, {
            tarRoot: "site",
            urlRoot: "V2",
            entries: yield* website,
          }));
        },
      },
      serveApidocs: {
        *middleware(_, request) {
          return yield* expect(serveTar(request, {
            tarRoot: "api/v2",
            urlRoot: "V2/api",
            entries: yield* apidocs,
          }));
        },
      },
    });
  });
}

function* loadTar(url: string) {
  let response = yield* expect(fetch(url));
  if (response.ok) {
    let website = new Map<string, TarEntry>();
    if (response.body) {
      let gunzip = new GzDecoder();
      let reader = response.body.getReader();
      try {
        let next = yield* expect(reader.read());
        while (!next.done) {
          gunzip.write(next.value);
          next = yield* expect(reader.read());
        }
        gunzip.flush();
      } finally {
        yield* expect(reader.cancel());
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
      });

      for (let entry of yield* each(stream(untar))) {
        if (entry.type === "directory" && entry.fileName.endsWith("/")) {
          //@ts-expect-error shut up
          entry.content = new Blob();
          //@ts-expect-error shut up
          website.set(entry.fileName.slice(0, -1), entry);
        } else {
          let parts: BlobPart[] = [];
          let buf = new Uint8Array(2048);
          try {
            while (true) {
              let bytesRead = yield* expect(entry.read(buf));
              if (bytesRead == null) {
                break;
              } else {
                parts.push(buf.slice(0, bytesRead));
              }
            }
          } finally {
            yield* expect(entry.discard());
          }
          //@ts-expect-error shut up
          entry.content = new Blob(parts);
          //@ts-expect-error shut up
          website.set(entry.fileName, entry);
        }
        yield* each.next;
      }
    }
    return website;
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
}
