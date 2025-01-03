import { call, type Operation } from "effection";
import {
  doc,
  type DocNode,
  type DocOptions,
  JsDoc,
} from "jsr:@deno/doc@0.162.4";
import { replaceAll } from "../lib/replace-all.ts";
import { useDescription } from "./use-description-parse.tsx";

export type { DocNode };

export type ResolveLinkFunction = (
  symbol: string,
  connector?: string,
  method?: string,
) => Operation<string>;

export function* defaultLinkResolver(symbol: string, connector?: string, method?: string) {
  const name = [symbol, connector, method].filter(Boolean).join("");
  return `[${name}](${name})`;
}

export function* useDenoDoc(
  specifiers: string[],
  docOptions?: DocOptions,
): Operation<Record<string, DocNode[]>> {
  return yield* call(() => doc(specifiers, docOptions));
}

export interface DocPage {
  name: string;
  sections: DocPageSection[];
  description: string;
  kind: string;
}

export interface DocPageSection {
  node: DocNode;

  markdown?: string;

  ignore: boolean;
}

export function* useDocPages(docs: Record<string, DocNode[]>, options: { resolveMarkdownLink: ResolveLinkFunction }) {
  
  const entrypoints: Record<string, DocPage[]> = {};

  for (const [url, all] of Object.entries(docs)) {
    const pages: DocPage[] = [];
    for (const [symbol, nodes] of Object.entries(Object.groupBy(all, node => node.name))) {
      if (nodes) {
        const sections: DocPageSection[] = [];
        for (const node of nodes) {
          if (node.jsDoc) {
            const { markdown, ignore } = yield* extractJsDoc(node.jsDoc, options?.resolveMarkdownLink);
            sections.push({
              node,
              markdown,
              ignore
            })
          } else {
            sections.push({
              node,
              markdown: "",
              ignore: false
            })
          }
        }

        const description = yield* useDescription(sections.map(s => s.markdown).filter(m => m).join(""));

        pages.push({
          name: symbol,
          kind: nodes?.at(0)?.kind ?? "",
          description,
          sections
        }) 
      }
    }

    entrypoints[url] = pages;
  }

  return entrypoints;
}

export function* extractJsDoc(doc: JsDoc, resolve: ResolveLinkFunction = defaultLinkResolver) {
  let markdown = "";
  let ignore = false;

  function* replaceLinks(doc: string) {
    return yield* replaceAll(doc, /{@link\s*(\w*)(\W)?(\w*)?}/gm, function* (match) {
      const [, symbol, connector, method] = match;
      return yield* resolve(symbol, connector, method);
    });
  }

  if (doc.doc) {
    markdown += yield* replaceLinks(doc.doc);
  }

  if (doc.tags) {
    for (const tag of doc.tags) {
      switch (tag.kind) {
        case "ignore": {
          ignore = true;
          break;
        }
        case "example": {
          markdown += yield* replaceLinks(tag.doc)
          break;
        }
      }
    }
  }

  return {
    markdown,
    ignore
  };
}