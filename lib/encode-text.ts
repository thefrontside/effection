import type { Nodes } from "npm:@types/hast@3.0.4";
import type { Root } from "npm:@types/mdast@4.0.4";
import { visit } from "npm:unist-util-visit@5.0.0";
import { encode, EncodeOptions } from "npm:html-entities@2.5.2";

/**
 * Encode HTML entities that can prevent MDX from parsing
 * for example `Operation<Data<File>>`
 */
export function encodeText(options?: EncodeOptions) {
  return function (tree: Root) {
    return visit(tree, "text,code", (node: Nodes) => {
      if (node.type === "text") {
        node.value = encode(node.value, options);
      }
    });
  };
}
