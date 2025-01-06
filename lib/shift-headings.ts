import type { Nodes, Root } from "npm:@types/mdast@4.0.4";
import { visit } from "npm:unist-util-visit@5.0.0";

export function shiftHeadings(amount: number) {
  return (tree: Root) => {
    visit(tree, (node: Nodes) => {
      if (node.type === "heading") {
        const depth = node.depth + amount;
        if (depth < 1) {
          node.depth = 1;
        } else if (depth > 6) {
          node.depth = 6;
        } else {
          node.depth = depth as 1 | 2 | 3 | 4 | 5 | 6;
        }
      }
    });
  };
}
