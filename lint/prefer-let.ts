type VariableDeclaration = Deno.lint.VariableDeclaration;

const plugin: Deno.lint.Plugin = {
  name: "effection",
  rules: {
    "prefer-let": {
      create(context) {
        function isTopLevelScope(node: VariableDeclaration): boolean {
          // deno-lint-ignore no-explicit-any
          let current: any = node.parent;

          // Walk up the tree until we find a function, block, or reach the program

          while (current) {
            switch (current.type) {
              // These create new scopes - if we hit one, we're not at top level

              case "FunctionDeclaration":
              case "FunctionExpression":
              case "ArrowFunctionExpression":
              case "BlockStatement":
                // Exception: BlockStatement that is direct child of Program is still top-level

                if (
                  current.type === "BlockStatement" &&
                  current.parent?.type === "Program"
                ) {
                  current = current.parent;

                  continue;
                }

                return false;

              case "Program":
                return true;
              default:
                current = current.parent;
            }
          }

          return false;
        }

        return {
          VariableDeclaration(node) {
            if (node.kind === "var") {
              context.report({
                message: "prefer `let` over `var` to declare value bindings",
                node,
              });
            } else if (node.kind === "const" && !isTopLevelScope(node)) {
              context.report({
                message: "`const` declaration outside top-level scope",
                node,
              });
            }
          },
        };
      },
    },
  },
};

export default plugin;
