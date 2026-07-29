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
  let name = parts.filter(Boolean).join("");
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
  let sanitize = createJsDocSanitizer(
    options?.linkResolver ?? defaultLinkResolver,
  );
  let sanitized = escapeMdxSyntax(yield* sanitize(markdown));

  let mod = yield* useMDX(sanitized, {
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
            "group scroll-mt-[100px] grow",
          pre: "grid",
        },
      ],
      ...(options?.rehypePlugins ?? []),
    ],
    remarkRehypeOptions: options?.remarkRehypeOptions,
  });

  return yield* call(async () => {
    try {
      let result = await mod.default();
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

/**
 * Escape `<` that opens a type expression (e.g. `Operation<Chain<T>>`,
 * `From<A | B>`, `Middleware<[], Promise<void>>`) so MDX doesn't parse it as a
 * JSX tag and throw `ReferenceError: <Name> is not defined` for the type name,
 * and neutralize stray `{...}` expressions (e.g. a bare `{Scope}` left by a
 * malformed `{@link}`) that MDX would otherwise evaluate as JavaScript.
 *
 * A `<` is treated as a type opener when it is followed by an uppercase
 * identifier, `[`, or `{`, or when it attaches to a preceding identifier
 * (`Promise<`, `)<`). Real HTML — `<div>`, ` <img>`, closing `</div>` — sits at
 * a word boundary starting lowercase (or is a closing tag) and is left intact.
 * `{`/`}` become their HTML entities so they render as literal braces.
 * Everything inside inline code and fenced code blocks is left untouched.
 */
export function escapeMdxSyntax(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`]*`)/g)
    .map((part, i) => (i % 2 === 0 ? escapeOutsideCode(part) : part))
    .join("");
}

function escapeOutsideCode(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === "<") {
      let next = text[i + 1] ?? "";
      let prev = text[i - 1] ?? "";
      let isTypeOpener = next !== "/" &&
        (/[A-Z[{]/.test(next) || /[A-Za-z0-9_$)\]}]/.test(prev));
      if (isTypeOpener) {
        out += "&lt;";
        continue;
      }
    } else if (char === "{") {
      out += "&#123;";
      continue;
    } else if (char === "}") {
      out += "&#125;";
      continue;
    }
    out += char;
  }
  return out;
}

export function createJsDocSanitizer(
  resolver: ResolveLinkFunction = defaultLinkResolver,
) {
  return function* sanitizeJsDoc(doc: string) {
    return yield* replaceAll(
      doc,
      /@?{@?link\s*(\w*)([^\w}])?(\w*)?([^}]*)?}/gm,
      function* (match) {
        let [, symbol, connector, method] = match;
        return yield* resolver(symbol, connector, method);
      },
    );
  };
}
