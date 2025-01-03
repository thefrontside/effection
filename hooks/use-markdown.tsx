import { call, type Operation } from "effection";
import type { JSXElement } from "revolution/jsx-runtime";
import { useMDX } from "./use-mdx.tsx";
import { replaceAll } from "../lib/replace-all.ts";

export function* useMarkdown(markdown: string): Operation<JSXElement> {
  const mod = yield* useMDX(markdown);

  return yield* call(() => mod.default());
}

export function* defaultLinkResolver(
  symbol: string,
  connector?: string,
  method?: string,
) {
  let parts = [symbol];
  if (connector && method) {
    parts.push(connector, method);
  }
  const name = parts.filter(Boolean).join("");
  return `[${name}](${name})`;
}

export type ResolveLinkFunction = (
  symbol: string,
  connector?: string,
  method?: string,
) => Operation<string>;

export function* useJsDocMarkdown(
  markdown: string,
  resolve: ResolveLinkFunction = defaultLinkResolver,
) {
  const sanitize = createJsDocSanitizer(resolve)
  const sanitized = yield* sanitize(markdown);

  return yield* useMarkdown(sanitized);
}

export function createJsDocSanitizer(resolver: ResolveLinkFunction = defaultLinkResolver) {
  return function* sanitizeJsDoc(doc: string) {
    return yield* replaceAll(
      doc,
      /@?{@?link\s*(\w*)(\W+)?(\w*)?}/gm,
      function* (match) {
        const [, symbol, connector, method] = match;
        return yield* resolver(symbol, connector, method);
      }
    );
  }
}
