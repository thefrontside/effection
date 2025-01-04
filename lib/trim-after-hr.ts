import type { Nodes } from "npm:@types/hast@3.0.4";
import type { Root } from "npm:@types/mdast@4.0.4";
import { EXIT, visit } from "npm:unist-util-visit@5.0.0";

/**
 * Removes all content after <hr /> in the root element.
 * This is used to restrict the length of the description by eliminating everything after <hr />
 * @returns
 */
export function trimAfterHR() {
  return function (tree: Root) {
    return visit(tree, (node: Nodes, index: number, parent: Nodes) => {
      if (
        node.type === "element" && node.tagName === "hr" &&
        parent.type === "root"
      ) {
        parent.children = parent.children.slice(0, index);
        return EXIT;
      }
    });
  };
}
