import type { Nodes } from "hast";
import { EXIT, visit } from "unist-util-visit";

/**
 * Removes all content after <hr /> in the root element.
 * This is used to restrict the length of the description by eliminating everything after <hr />
 * @returns
 */
export function trimAfterHR() {
  return function (tree: Nodes) {
    visit(
      tree,
      (node: Nodes, index: number | undefined, parent: Nodes | undefined) => {
        if (
          node.type === "element" && node.tagName === "hr" &&
          parent?.type === "root"
        ) {
          parent.children = parent.children.slice(0, index);
          return EXIT;
        }
      },
    );
  };
}
