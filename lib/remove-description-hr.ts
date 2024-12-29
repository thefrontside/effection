// @ts-nocheck Node type is missing attributes
import { EXIT, visit } from "npm:unist-util-visit@5.0.0";
import type { Node } from "npm:@types/unist@3.0.3";

/**
 * Remove the HR element used to define the end of the description.
 */
export function removeDescriptionHR() {
  return function (tree: Node) {
    return visit(tree, (node, index, parent) => {
      if (
        node.type === "element" && node.tagName === "hr" &&
        parent.type === "root"
      ) {
        const beforeHR = parent.children
          .slice(0, index)
          .filter((node) => !(node.type === "text" && node.value === "\n"));

        // assume this hr is for a description if there are only two elements and
        // second element is a paragraph.
        if (
          beforeHR.length === 2 && beforeHR[1].type === "element" &&
          beforeHR[1].tagName === "p"
        ) {
          parent.children = parent.children.filter((child) => child !== node);
        }

        return EXIT;
      }
    });
  };
}
