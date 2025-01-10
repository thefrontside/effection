import { call, type Operation } from "effection";

import type { JSXElement } from "revolution";

import { ResolveLinkFunction, useMarkdown } from "../hooks/use-markdown.tsx";
import { shiftHeadings } from "../lib/shift-headings.ts";
import { Package } from "../resources/package.ts";
import { DocPageContext } from "../context/doc-page.ts";
import { Type } from "./type/jsx.tsx";
import { NO_DOCS_AVAILABLE } from "./type/markdown.tsx";

interface APIOptions {
  pkg: Package;
  linkResolver: ResolveLinkFunction;
}

export function* API({ pkg, linkResolver }: APIOptions): Operation<JSXElement> {
  const elements: JSXElement[] = [];
  const docs = yield* pkg.docs();

  for (const exportName of Object.keys(docs)) {
    const pages = docs[exportName];
    for (const page of pages) {
      for (const section of page.sections) {
        elements.push(
          <section id={section.id} class="flex flex-col border-b-2 pb-5">
            <h3 class="flex">
              {
                yield* Type({
                  node: section.node,
                })
              }
            </h3>
            <div class="[&>h3:first-child]:mt-0">
              {
                yield* call(function* () {
                  yield* DocPageContext.set(page);
                  return yield* useMarkdown(
                    section.markdown || NO_DOCS_AVAILABLE,
                    {
                      remarkPlugins: [[shiftHeadings, 1]],
                      linkResolver,
                      slugPrefix: section.id,
                    },
                  );
                })
              }
            </div>
          </section>,
        );
      }
    }
  }

  return <>{elements}</>;
}
