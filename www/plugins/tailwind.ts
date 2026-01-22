import { crypto } from "@std/crypto";
import { encodeHex } from "@std/encoding/hex";
import { emptyDir, exists } from "@std/fs";
import { serveFile } from "@std/http";
import { join } from "@std/path";
import { Operation, until } from "effection";
import { select } from "hast-util-select";
import type { RevolutionPlugin } from "revolution";
import { $ } from "../context/shell.ts";

export interface TailwindOptions {
  readonly input: string;
  readonly outdir: string;
}

export function* tailwindPlugin(
  options: TailwindOptions,
): Operation<RevolutionPlugin> {
  yield* until(emptyDir(options.outdir));

  let css = yield* compileCSS(options);

  return {
    *html(request, next) {
      let html = yield* next(request);
      let head = select("head", html);
      head?.children.push({
        type: "element",
        tagName: "link",
        properties: { rel: "stylesheet", href: css.href },
        children: [],
      });
      return html;
    },
    http(request, next) {
      let url = new URL(request.url);
      if (url.pathname === css.csspath) {
        return until(serveFile(request, css.filepath));
      } else {
        return next(request);
      }
    },
  };
}

interface CSS {
  filepath: string;
  csspath: string;
  href: string;
}

function* compileCSS(options: TailwindOptions): Operation<CSS> {
  let { input, outdir } = options;
  let output = join(outdir, input);

  yield* $(
    `deno run -A \
--unstable-detect-cjs \
npm:@tailwindcss/cli@^4.0.0 \
--config tailwind.config.ts \
--input ${input} \
--output ${output}`,
  );

  if (yield* until(exists(output))) {
    let content = yield* until(Deno.readFile(output));
    let buffer = yield* until(crypto.subtle.digest("SHA-256", content));
    let hash = encodeHex(buffer);
    return {
      filepath: output,
      csspath: `/${output}`,
      href: `/${output}?${hash}`,
    };
  }

  throw new Error(`failed to generate ${output}`);
}
