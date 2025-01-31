import { Options } from "npm:@jsdevtools/rehype-toc@3.0.2";
import { createTOC } from "npm:@jsdevtools/rehype-toc@3.0.2/lib/create-toc.js";
import { customizationHooks } from "npm:@jsdevtools/rehype-toc@3.0.2/lib/customization-hooks.js";
import { findHeadings } from "npm:@jsdevtools/rehype-toc@3.0.2/lib/fiind-headings.js";
import { findMainNode } from "npm:@jsdevtools/rehype-toc@3.0.2/lib/find-main-node.js";
import { NormalizedOptions } from "npm:@jsdevtools/rehype-toc@3.0.2/lib/options.js";
import type { Nodes } from "npm:@types/hast@3.0.4";
import { JSXElement } from "revolution/jsx-runtime";

export function createToc(root: Nodes, options?: Options): JSXElement {
  const _options = new NormalizedOptions(
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
  return customizationHooks(tocNode, _options);
}
