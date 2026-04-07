import { createContext, type Operation, until } from "effection";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { useFonts } from "./fonts.ts";

export interface ImageStore {
  render(svg: string, width: number, key: string): Uint8Array;
}

const ImageStoreContext = createContext<ImageStore>("image-store");

export function* initImageStore(): Operation<void> {
  let existing = yield* ImageStoreContext.get();
  if (existing) {
    throw new Error(
      "initImageStore() called more than once — resvg wasm can only be initialized once per process",
    );
  }

  let require = createRequire(import.meta.url);
  let wasmPath = require.resolve("@resvg/resvg-wasm/index_bg.wasm");
  let wasm = yield* until(readFile(wasmPath));
  yield* until(initWasm(wasm));

  let fonts = yield* useFonts();
  let cache = new Map<string, Uint8Array>();

  yield* ImageStoreContext.set({
    render(svg, width, key) {
      let cached = cache.get(key);
      if (cached) {
        return cached;
      }
      let resvg = new Resvg(svg, {
        font: {
          fontBuffers: fonts.buffers,
          defaultFontFamily: fonts.defaultFamily,
          monospaceFamily: fonts.monospaceFamily,
        },
        fitTo: { mode: "width", value: width },
      });
      let png = resvg.render().asPng();
      cache.set(key, png);
      return png;
    },
  });
}

export function* useImageStore(): Operation<ImageStore> {
  return yield* ImageStoreContext.expect();
}
