import { call, type Operation } from "effection";
import { useMDX, UseMDXOptions } from "./use-mdx.tsx";
import { replaceAll } from "../lib/replace-all.ts";
import { removeDescriptionHR } from "../lib/remove-description-hr.ts";
import rehypePrismPlus from "npm:rehype-prism-plus@2.0.0";
import remarkGfm from "npm:remark-gfm@4.0.0";

export function* defaultLinkResolver(
  symbol: string,
  connector?: string,
  method?: string,
) {
  let parts = [symbol];
  if (symbol && connector && method) {
    parts.push(connector, method);
  }
  const name = parts.filter(Boolean).join("");
  if (name) {
    return `[${name}](${name})`;
  }
  return "";
}

interface UseMarkdownOptions {
  linkResolver?: ResolveLinkFunction;
}

export type ResolveLinkFunction = (
  symbol: string,
  connector?: string,
  method?: string,
) => Operation<string>;

export function* useMarkdown(
  markdown: string,
  options?: UseMDXOptions & UseMarkdownOptions,
) {
  /**
   * I'm doing this pre-processing here because MDX throws a parse error when it encounteres `{@link }`. 
   * I can't use a remark/rehype plugin to change this because they are applied after MDX parses is successful. 
   */
  const sanitize = createJsDocSanitizer(
    options?.linkResolver ?? defaultLinkResolver,
  );
  const sanitized = yield* sanitize(markdown);

  const mod = yield* useMDX(sanitized, {
    remarkPlugins: [remarkGfm, ...options?.remarkPlugins ?? []],
    rehypePlugins: [
      [removeDescriptionHR],
      [
        rehypePrismPlus,
        {
          showLineNumbers: true,
        },
      ],
      ...options?.rehypePlugins ?? []
    ],
    remarkRehypeOptions: options?.remarkRehypeOptions
  });

  return yield* call(() => mod.default());
}

export function createJsDocSanitizer(
  resolver: ResolveLinkFunction = defaultLinkResolver,
) {
  return function* sanitizeJsDoc(doc: string) {
    return yield* replaceAll(
      doc,
      /@?{@?link\s*(\w*)([^\w}])?(\w*)?([^}]*)?}/gm,
      function* (match) {
        const [, symbol, connector, method] = match;
        return yield* resolver(symbol, connector, method);
      },
    );
  };
}
