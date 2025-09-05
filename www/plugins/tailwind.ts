import { emptyDir, exists } from "jsr:@std/fs";
import { join } from "jsr:@std/path";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";
import { Operation, until } from "effection";
import type { RevolutionPlugin } from "revolution";
import { select } from "npm:hast-util-select";
import { serveFile } from "jsr:@std/http@1.0.20";
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

  const result = yield* $(
`deno run -A \
--unstable-detect-cjs \
npm:@tailwindcss/cli@^4.0.0 \
--config tailwind.config.ts \
--input ${input} \
--output ${output}`);

  if (yield* until(exists(output))) {
    let content = yield* until(Deno.readFile(output));
    const buffer = yield* until(crypto.subtle.digest("SHA-256", content));
    const hash = encodeHex(buffer);
    return {
      filepath: output,
      csspath: `/${output}`,
      href: `/${output}?${hash}`,
    };
  }

  throw new Error(`failed to generate ${output}`);
}
