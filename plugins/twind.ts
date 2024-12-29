import type { HASTElement, RevolutionPlugin } from "revolution";
import {
  setup,
  stringify,
  tw,
  type TwindConfig,
  virtual,
} from "npm:@twind/core@1.1.3";

export interface TwindRevolution {
  config: TwindConfig;
}

export function twindPlugin(options: TwindRevolution): RevolutionPlugin {
  let { config } = options;

  return {
    *html(request, next) {
      let html = yield* next(request);
      let sheet = virtual();

      setup(config, sheet);

      visit(html);

      let css = stringify(sheet.target);

      let head = html.children.find((child) =>
        child.type === "element" && child.tagName === "head"
      ) as HASTElement | undefined;

      head?.children.push({
        type: "element",
        tagName: "style",
        properties: { type: "text/css" },
        children: [{ type: "text", value: css }],
      });

      return html;
    },
  };
}

function visit(element: HASTElement): void {
  let { properties: { className: classnames } = {}, children } = element;
  if (classnames) {
    tw(String(classnames));
  }
  for (let child of children) {
    if (!!child && child.type === "element") {
      visit(child);
    }
  }
}
