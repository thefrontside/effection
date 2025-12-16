import type { JSXChild, JSXElement } from "revolution";

export interface Transformer {
  (node: JSXElement): JSXElement;
}

export interface TransformOptions {
  fn: Transformer;
  children: JSXChild | JSXChild[];
}

export function Transform(options: TransformOptions): JSX.Element {
  let { children, fn } = options;

  if (Array.isArray(children)) {
    return {
      type: "root",
      //@ts-expect-error dem hast types!
      children: children.map((child) => transform(child, fn)),
    };
  } else {
    return transform(children, fn);
  }
}

export function transform(child: JSXChild, fn: Transformer): JSX.Element {
  switch (typeof child) {
    case "string":
    case "number":
    case "boolean":
      return fn({ type: "text", value: String(child) });
    default:
      switch (child.type) {
        case "text":
        case "element":
          return fn(child);
        default: {
          let children = child.children as unknown as JSXElement[];
          //@ts-expect-error dem hast types!
          return { type: "root", children: children.map(fn) };
        }
      }
  }
}
