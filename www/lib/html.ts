import type { Params, ServeHandler } from "./types.ts";
import type { Operation } from "effection";

import { twind } from "freejack/twind.ts";
import { render } from "html/render-incremental-dom.ts";
import { Document } from "dom";

export const html = {
  get(operation: (params: Params) => Operation<JSX.Element>): ServeHandler {
    return {
      method: "GET",
      *middleware(params) {
        let top = yield* operation(params);
        let doc = new Document().implementation.createHTMLDocument();
        if (!doc.documentElement) {
          throw new Error("null document element");
        }

        let element = doc.documentElement;

        render(top, element);

        twind(top, doc);

        let text = `<!DOCTYPE html>${element.outerHTML}`;

        return new Response(text, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html",
          },
        });
      },
    };
  },
};
