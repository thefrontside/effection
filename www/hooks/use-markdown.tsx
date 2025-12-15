import { call, type Operation } from "effection";
import rehypeAddClasses from "rehype-add-classes";
import rehypePrismPlus from "rehype-prism-plus";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { JSXElement } from "revolution/jsx-runtime";
import { removeDescriptionHR } from "../lib/remove-description-hr.ts";
import { replaceAll } from "../lib/replace-all.ts";
import { useMDX, UseMDXOptions } from "./use-mdx.tsx";

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

export type ResolveLinkFunction = (
  symbol: string,
  connector?: string,
  method?: string,
) => Operation<string>;

export type UseMarkdownOptions = UseMDXOptions & {
  linkResolver?: ResolveLinkFunction;
  slugPrefix?: string;
};

export function* useMarkdown(
  markdown: string,
  options?: UseMarkdownOptions,
): Operation<JSXElement> {
  /**
   * I'm doing this pre-processing here because MDX throws a parse error when it encounteres `{@link }`.
   * I can't use a remark/rehype plugin to change this because they are applied after MDX parses is successful.
   */
  const sanitize = createJsDocSanitizer(
    options?.linkResolver ?? defaultLinkResolver,
  );
  const sanitized = yield* sanitize(markdown);

  const mod = yield* useMDX(sanitized, {
    remarkPlugins: [remarkGfm, ...(options?.remarkPlugins ?? [])],
    rehypePlugins: [
      [removeDescriptionHR],
      [
        rehypePrismPlus,
        {
          showLineNumbers: true,
        },
      ],
      [
        rehypeSlug,
        {
          prefix: options?.slugPrefix ? `${options.slugPrefix}-` : undefined,
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className:
              "opacity-0 group-hover:opacity-100 after:content-['#'] after:ml-1.5 no-underline",
          },
        },
      ],
      [
        rehypeAddClasses,
        {
          "h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]":
            "group scroll-mt-[100px]",
          pre: "grid",
        },
      ],
      ...(options?.rehypePlugins ?? []),
    ],
    remarkRehypeOptions: options?.remarkRehypeOptions,
  });

  return yield* call(async () => {
    try {
      const result = await mod.default();
      return result;
    } catch (e) {
      console.error(
        `Failed to convert markdown to JSXElement for ${markdown}`,
        e,
      );
      return <></>;
    }
  });
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
