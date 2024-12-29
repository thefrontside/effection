// @ts-nocheck Node type is missing attributes
import { EXIT, visit } from "npm:unist-util-visit@5.0.0";
import type { Node } from "npm:@types/unist@3.0.3";

/**
 * Removes all content after <hr /> in the root element.
 * This is used to restrict the length of the description by eliminating everything after <hr />
 * @returns
 */
export function trimAfterHR() {
  return function (tree: Node) {
    return visit(tree, (node, index, parent) => {
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
