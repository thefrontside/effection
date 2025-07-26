import { exists } from "jsr:@std/fs";
import { join } from "jsr:@std/path";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";
import { x } from "jsr:@effection-contrib/tinyexec";
import { call, Operation } from "effection";
import type { RevolutionPlugin } from "revolution";
import { select } from "npm:hast-util-select";
import { serveFile } from "https://deno.land/std@0.206.0/http/file_server.ts";

export interface TailwindOptions {
  readonly input: string;
  readonly outdir: string;
}

export function* tailwindPlugin(
  options: TailwindOptions,
): Operation<RevolutionPlugin> {
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
    *http(request, next) {
      let url = new URL(request.url);
      if (url.pathname === css.csspath) {
        return yield* call(() => serveFile(request, css.filepath));
      } else {
        return yield* next(request);
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
  let outpath = join(outdir, input);
  let proc = yield* x("deno", [
    "run",
    "-A",
    "npm:@tailwindcss/cli@^4.0.0",
    "--config",
    "tailwind.config.ts",
    "--input",
    input,
    "--output",
    outpath,
  ]);
  let result = yield* proc;
  if (result.stderr) {
    console.log(result.stderr);
  }
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (yield* call(() => exists(outpath))) {
    let content = yield* call(() => Deno.readFile(outpath));
    const buffer = yield* call(() => crypto.subtle.digest("SHA-256", content));
    const hash = encodeHex(buffer);
    return {
      filepath: outpath,
      csspath: `/${outpath}`,
      href: `/${outpath}?${hash}`,
    };
  }
  throw new Error(`failed to generate ${outpath}`);
}
