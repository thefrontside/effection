import type { Nodes } from "hast";
import { EXIT, visit } from "unist-util-visit";

/**
 * Remove the HR element used to define the end of the description.
 */
export function removeDescriptionHR() {
  return function (tree: Nodes) {
    return visit(tree, (node, index, parent) => {
      if (
        node.type === "element" && node.tagName === "hr" &&
        parent?.type === "root"
      ) {
        let beforeHR = parent.children
          .slice(0, index)
          .filter((node: Nodes) =>
            !(node.type === "text" && node.value === "\n")
          );

        // assume this hr is for a description if there are only two elements and
        // second element is a paragraph.
        if (
          beforeHR.length === 2 && beforeHR[1].type === "element" &&
          beforeHR[1].tagName === "p"
        ) {
          parent.children = parent.children.filter((child: Nodes) =>
            child !== node
          );
        }

        return EXIT;
      }
    });
  };
}
