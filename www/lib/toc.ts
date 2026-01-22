import { Options } from "@jsdevtools/rehype-toc";
import { createTOC } from "@jsdevtools/rehype-toc/lib/create-toc.js";
import { customizationHooks } from "@jsdevtools/rehype-toc/lib/customization-hooks.js";
import { findHeadings } from "@jsdevtools/rehype-toc/lib/fiind-headings.js";
import { findMainNode } from "@jsdevtools/rehype-toc/lib/find-main-node.js";
import { NormalizedOptions } from "@jsdevtools/rehype-toc/lib/options.js";
import type { Nodes } from "hast";
import { JSXElement } from "revolution/jsx-runtime";

export function createToc(root: Nodes, options?: Options): JSXElement {
  let _options = new NormalizedOptions(
    options ?? {
      cssClasses: {
        toc:
          "hidden text-sm font-light tracking-wide leading-loose lg:block relative pt-2",
        link: "hover:underline hover:underline-offset-2",
      },
    },
  );

  // Find the <main> or <body> element
  let [mainNode] = findMainNode(root);

  // Find all heading elements
  let headings = findHeadings(mainNode, _options);

  // Create the table of contents
  let tocNode = createTOC(headings, _options);

  // Allow the user to customize the table of contents before we add it to the page
  return customizationHooks(tocNode, _options) as unknown as JSXElement;
}
